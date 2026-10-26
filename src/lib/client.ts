"use client";

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body ? { "content-type": "application/json", ...(init.headers ?? {}) } : init?.headers,
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body as T;
}

/** Reads a newline-delimited JSON stream and calls onEvent for each event. */
export async function readStream<E>(url: string, payload: unknown, onEvent: (e: E) => void, signal?: AbortSignal): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line) onEvent(JSON.parse(line) as E);
    }
  }
  if (buffer.trim()) onEvent(JSON.parse(buffer) as E);
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const shortFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

/** Pipedrive returns "YYYY-MM-DD HH:mm:ss" in UTC without a zone; ISO strings pass through. */
export function parseDate(s: string): Date {
  return new Date(/T/.test(s) ? s : `${s.replace(" ", "T")}Z`);
}

export function formatDate(s: string | null | undefined): string {
  if (!s) return "";
  const d = parseDate(s);
  return d.getFullYear() === new Date().getFullYear() ? shortFmt.format(d) : dateFmt.format(d);
}

export function formatRelative(s: string): string {
  const diff = Date.now() - parseDate(s).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  return formatDate(s);
}

export function formatMoney(v: { amount: number; currency: string } | null): string {
  if (!v || !v.amount) return "";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: v.currency || "EUR", maximumFractionDigits: 0 }).format(v.amount);
}

export function hostOf(url: string): string {
  try {
    return new URL(/^https?:/.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function pathOf(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname === "/" ? u.hostname.replace(/^www\./, "") : u.pathname.replace(/\/$/, "");
  } catch {
    return url;
  }
}
