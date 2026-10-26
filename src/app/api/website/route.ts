import { extractCompanyNotes } from "@/lib/ai";
import { setLeadWebsite } from "@/lib/db";
import { ndjson } from "@/lib/http";
import { normalizeUrl, scrapeCompanySite, type ScrapedPage } from "@/lib/scraper";

// Page text stays on the server; the browser only needs status and size.
const withoutText = ({ text, ...page }: ScrapedPage) => (void text, page);

export async function POST(request: Request) {
  const body = (await request.json()) as { url?: string; leadId?: string; company?: string };
  let url: URL;
  try {
    url = normalizeUrl(body.url ?? "");
  } catch {
    return Response.json({ error: "That doesn't look like a web address." }, { status: 400 });
  }
  if (body.leadId) setLeadWebsite(body.leadId, url.hostname + (url.pathname === "/" ? "" : url.pathname));

  return ndjson(async (send) => {
    const pages = await scrapeCompanySite(url.toString(), (e) =>
      send(e.type === "page-done" ? { ...e, page: { ...e.page, text: undefined } } : e),
    );
    const read = pages.filter((p) => p.status === "read" && p.chars > 0);
    if (!read.length) {
      send({ type: "done", pages: pages.map(withoutText), companyNotes: [] });
      return;
    }
    send({ type: "extracting", pages: read.length });
    const companyNotes = await extractCompanyNotes(body.company || url.hostname, pages, request.signal);
    send({ type: "done", pages: pages.map(withoutText), companyNotes });
  });
}
