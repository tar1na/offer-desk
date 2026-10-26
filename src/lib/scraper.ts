import "server-only";
import dns from "node:dns";
import { BlockList, isIP } from "node:net";
import { Agent, fetch as undiciFetch } from "undici";
import * as cheerio from "cheerio";
import type { WebsitePage } from "./types";

const USER_AGENT = "Mozilla/5.0 (compatible; OfferDesk/1.0; +local demo)";
const FETCH_TIMEOUT_MS = 12_000;
const MAX_BYTES = 2_500_000;
const MAX_CHARS_PER_PAGE = 7_000;
const MAX_LINKED_PAGES = 3;

export type ScrapedPage = WebsitePage & { text: string };

export type ScrapeEvent =
  | { type: "page-start"; url: string; label: string }
  | { type: "page-done"; page: WebsitePage }
  | { type: "links"; urls: string[] };

export function normalizeUrl(input: string): URL {
  const trimmed = input.trim();
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withScheme);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Only http and https addresses can be read.");
  url.hash = "";
  return url;
}

const hostKey = (h: string) => h.toLowerCase().replace(/^www\./, "");

const MAX_REDIRECTS = 5;
const BLOCKED_CODE = "OFFERDESK_PRIVATE_ADDRESS";
const PRIVATE_MESSAGE = "That address points to a private network and can't be read.";

// Everything that is not the public internet. BlockList also matches IPv4-mapped IPv6 (::ffff:…) against the IPv4 rules.
const privateRanges = new BlockList();
for (const [net, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) privateRanges.addSubnet(net, prefix, "ipv4");
for (const [net, prefix] of [
  ["::", 128], ["::1", 128], ["::", 96], ["64:ff9b::", 96], ["64:ff9b:1::", 48], ["100::", 64],
  ["2001::", 32], ["2001:db8::", 32], ["2002::", 16], ["fc00::", 7], ["fe80::", 10], ["fec0::", 10], ["ff00::", 8],
] as const) privateRanges.addSubnet(net, prefix, "ipv6");

function isPrivateAddress(ip: string): boolean {
  const family = isIP(ip);
  if (!family) return true;
  return privateRanges.check(ip, family === 4 ? "ipv4" : "ipv6");
}

type LookupCallback = (err: NodeJS.ErrnoException | null, address?: string | dns.LookupAddress[], family?: number) => void;

/** DNS lookup used by the socket itself, so the address that gets checked is the one that gets connected (no rebinding). */
function checkedLookup(hostname: string, options: dns.LookupOptions, callback: LookupCallback) {
  dns.lookup(hostname, { all: true, family: options.family }, (err, addresses) => {
    if (err) return callback(err);
    if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address))) {
      return callback(Object.assign(new Error(PRIVATE_MESSAGE), { code: BLOCKED_CODE }));
    }
    if (options.all) callback(null, addresses);
    else callback(null, addresses[0].address, addresses[0].family);
  });
}

const agent = new Agent({ connect: { lookup: checkedLookup as never } });

/** Only standard web ports, and IP literals (which skip DNS) must be public too. */
function assertPublicUrl(url: URL): void {
  if (!/^https?:$/.test(url.protocol)) throw new Error("Only http and https addresses can be read.");
  if (url.port && url.port !== "80" && url.port !== "443") throw new Error("Only standard web ports can be read.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host) && isPrivateAddress(host)) throw new Error(PRIVATE_MESSAGE);
}

/** fetch that follows redirects by hand so every hop is checked, through the address-checking agent. */
async function safeFetch(url: URL, init: { headers: Record<string, string>; signal?: AbortSignal }): Promise<Response> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    assertPublicUrl(current);
    let res: Response;
    try {
      res = (await undiciFetch(current, { ...init, redirect: "manual", dispatcher: agent })) as unknown as Response;
    } catch (e) {
      if ((e as { cause?: { code?: string } }).cause?.code === BLOCKED_CODE) throw new Error(PRIVATE_MESSAGE);
      throw e;
    }
    const location = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
    if (!location) return Object.assign(res, { finalUrl: current });
    await res.body?.cancel();
    current = new URL(location, current);
  }
  throw new Error("The site redirected too many times.");
}

async function fetchHtml(url: URL): Promise<{ html: string; finalUrl: URL }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await safeFetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml", "accept-language": "en,*;q=0.5" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`The site answered ${res.status}.`);
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html")) throw new Error("The address is not a web page.");
    const reader = res.body?.getReader();
    if (!reader) throw new Error("The site sent an empty page.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        break;
      }
      chunks.push(value);
    }
    const html = new TextDecoder("utf-8").decode(Buffer.concat(chunks));
    return { html, finalUrl: (res as Response & { finalUrl?: URL }).finalUrl ?? url };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") throw new Error("The site took too long to answer.");
    if (e instanceof TypeError) throw new Error("The site could not be reached.");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/** Minimal robots.txt check for the "*" group. Unreachable robots.txt means allowed. */
async function robotsDisallows(origin: string): Promise<string[]> {
  try {
    const res = await safeFetch(new URL("/robots.txt", origin), {
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return [];
    const lines = (await res.text()).split(/\r?\n/);
    const rules: string[] = [];
    let applies = false;
    for (const raw of lines) {
      const line = raw.replace(/#.*/, "").trim();
      const [k, ...rest] = line.split(":");
      const key = k?.toLowerCase();
      const value = rest.join(":").trim();
      if (key === "user-agent") applies = value === "*";
      else if (applies && key === "disallow" && value) rules.push(value);
    }
    return rules;
  } catch {
    return [];
  }
}

function blocked(path: string, rules: string[]): boolean {
  return rules.some((r) => (r === "/" ? true : path.startsWith(r.replace(/\*.*$/, ""))));
}

function extract($: cheerio.CheerioAPI): { title: string; text: string } {
  const title =
    $('meta[property="og:site_name"]').attr("content")?.trim() ||
    $("title").first().text().trim() ||
    $("h1").first().text().trim();
  const parts: string[] = [];
  const description = $('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content");
  if (description) parts.push(description.trim());

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).text());
      const items = Array.isArray(data) ? data : data["@graph"] ?? [data];
      for (const item of items) {
        const type = String(item?.["@type"] ?? "");
        if (/Organization|LocalBusiness|Corporation/.test(type)) {
          const facts = [
            item.name && `Name: ${item.name}`,
            item.description && `About: ${item.description}`,
            item.foundingDate && `Founded: ${item.foundingDate}`,
            item.numberOfEmployees?.value && `Employees: ${item.numberOfEmployees.value}`,
            item.address?.addressLocality && `Location: ${item.address.addressLocality}`,
          ].filter(Boolean);
          if (facts.length) parts.push(facts.join(". "));
        }
      }
    } catch {
      // Malformed JSON-LD is common; skip it.
    }
  });

  $("script, style, noscript, svg, iframe, form, nav, footer, header, aside, [aria-hidden='true'], [role='navigation']").remove();
  $("[class*='cookie'], [id*='cookie'], [class*='consent'], [id*='consent']").remove();
  const root = $("main").first().length ? $("main").first() : $("article").first().length ? $("article").first() : $("body");

  const seen = new Set<string>();
  root.find("h1, h2, h3, h4, p, li, td, blockquote, dd").each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    if (t.length < 3 || seen.has(t)) return;
    seen.add(t);
    const tag = el.tagName.toLowerCase();
    parts.push(/^h\d$/.test(tag) ? `\n## ${t}` : t);
  });
  let text = parts.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (text.length > MAX_CHARS_PER_PAGE) text = `${text.slice(0, MAX_CHARS_PER_PAGE)}…`;
  return { title: title || "", text };
}

const LINK_KEYWORDS: [RegExp, number][] = [
  [/about|who-we-are|company|om-oss|meista|uber-uns|about-us/, 10],
  [/services|solutions|what-we-do|offering|palvelut|tjanster/, 9],
  [/products|platform|features|tuotteet/, 8],
  [/industries|sectors|customers|clients|case-stud|references|referenssit/, 6],
  [/team|people|leadership/, 5],
  [/pricing|plans/, 4],
  [/locations|contact|yhteystiedot|kontakt/, 3],
];
const LINK_EXCLUDE = /privacy|terms|cookie|legal|login|signin|sign-in|register|cart|checkout|account|wp-admin|\.(pdf|jpe?g|png|gif|zip|docx?|xlsx?|mp4)$/i;

function pickLinks($: cheerio.CheerioAPI, base: URL): string[] {
  const scored = new Map<string, number>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (/^(mailto|tel|javascript):/i.test(href) || href.startsWith("#")) return;
    let url: URL;
    try {
      url = new URL(href, base);
    } catch {
      return;
    }
    if (hostKey(url.hostname) !== hostKey(base.hostname)) return;
    url.hash = "";
    url.search = "";
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (path === "/" || path === (base.pathname.replace(/\/+$/, "") || "/") || LINK_EXCLUDE.test(path)) return;
    const depth = path.split("/").filter(Boolean).length;
    const haystack = `${path} ${$(el).text()}`.toLowerCase();
    let score = 0;
    for (const [re, s] of LINK_KEYWORDS) if (re.test(haystack)) score = Math.max(score, s);
    if (!score) return;
    score -= Math.max(0, depth - 2) * 3;
    const key = `${url.origin}${path}`;
    scored.set(key, Math.max(scored.get(key) ?? -Infinity, score));
  });
  return [...scored.entries()]
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_LINKED_PAGES)
    .map(([u]) => u);
}

function labelFor(url: string): string {
  const path = new URL(url).pathname.replace(/\/+$/, "");
  return path ? path : "homepage";
}

/** Reads the homepage and up to three linked pages that describe the company. */
export async function scrapeCompanySite(input: string, onEvent: (e: ScrapeEvent) => void): Promise<ScrapedPage[]> {
  const start = normalizeUrl(input);
  const pages: ScrapedPage[] = [];
  const rules = await robotsDisallows(start.origin);

  onEvent({ type: "page-start", url: start.toString(), label: "homepage" });
  if (blocked(start.pathname, rules)) {
    const page: ScrapedPage = { url: start.toString(), title: "", status: "skipped", chars: 0, text: "", error: "The site's robots.txt asks not to be read." };
    onEvent({ type: "page-done", page });
    return [page];
  }
  let home: { html: string; finalUrl: URL };
  try {
    home = await fetchHtml(start);
  } catch (e) {
    const page: ScrapedPage = { url: start.toString(), title: "", status: "failed", chars: 0, text: "", error: (e as Error).message };
    onEvent({ type: "page-done", page });
    return [page];
  }
  const $home = cheerio.load(home.html);
  const links = pickLinks($home, home.finalUrl).filter((u) => !blocked(new URL(u).pathname, rules));
  const homeContent = extract($home);
  const homePage: ScrapedPage = {
    url: home.finalUrl.toString(),
    title: homeContent.title,
    status: "read",
    chars: homeContent.text.length,
    text: homeContent.text,
    error: homeContent.text.length < 200 ? "Very little readable text. The site may need JavaScript to show its content." : undefined,
  };
  pages.push(homePage);
  onEvent({ type: "page-done", page: homePage });
  onEvent({ type: "links", urls: links });

  for (const link of links) {
    onEvent({ type: "page-start", url: link, label: labelFor(link) });
    try {
      const { html, finalUrl } = await fetchHtml(new URL(link));
      const content = extract(cheerio.load(html));
      const page: ScrapedPage = { url: finalUrl.toString(), title: content.title, status: "read", chars: content.text.length, text: content.text };
      pages.push(page);
      onEvent({ type: "page-done", page });
    } catch (e) {
      const page: ScrapedPage = { url: link, title: "", status: "failed", chars: 0, text: "", error: (e as Error).message };
      pages.push(page);
      onEvent({ type: "page-done", page });
    }
  }
  return pages;
}
