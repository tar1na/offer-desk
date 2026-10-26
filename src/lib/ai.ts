import "server-only";
import OpenAI from "openai";
import type { CompanyNote, MeetingNote } from "./types";
import type { ScrapedPage } from "./scraper";

/** Models tried in order. A model that hasn't started answering within FIRST_TOKEN_MS is skipped. */
export const MODELS = (process.env.OPENAI_MODELS || process.env.OPENAI_MODEL || "gpt-6-luna,gpt-5.4,gpt-5.4-mini")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const FIRST_TOKEN_MS = Number(process.env.OPENAI_FIRST_TOKEN_MS || 15_000);

let client: OpenAI | null = null;
function ai(): OpenAI {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set in .env");
  client ??= new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
    timeout: 120_000,
    maxRetries: 0,
  });
  return client;
}

type Message = { role: "system" | "user"; content: string };

export type StreamPart = { type: "model"; model: string; fallbackFrom?: string } | { type: "delta"; text: string };

/** Streams a completion, moving to the next model when one is slow to start or fails before answering. */
export async function* streamWithFallback(messages: Message[], temperature: number, signal?: AbortSignal): AsyncGenerator<StreamPart> {
  let lastError: unknown = null;
  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i];
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    signal?.addEventListener("abort", onAbort);
    const timer = setTimeout(() => controller.abort(), FIRST_TOKEN_MS);
    let started = false;
    try {
      const stream = await ai().chat.completions.create({ model, temperature, stream: true, messages }, { signal: controller.signal });
      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content;
        if (!delta) continue;
        if (!started) {
          started = true;
          clearTimeout(timer);
          yield { type: "model", model, fallbackFrom: i > 0 ? MODELS[i - 1] : undefined };
        }
        yield { type: "delta", text: delta };
      }
      if (started) return;
      lastError = new Error(`${model} returned nothing`);
    } catch (e) {
      if (signal?.aborted) return;
      // Once text has streamed, a mid-answer failure is reported rather than silently restarted.
      if (started) throw new Error("The AI connection dropped mid-answer. Try again.");
      lastError = e;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
  }
  const detail = lastError instanceof Error && lastError.message ? ` (${lastError.message})` : "";
  throw new Error(`No AI model answered in time${detail}. Check the router and try again.`);
}

export async function extractCompanyNotes(company: string, pages: ScrapedPage[], signal?: AbortSignal): Promise<CompanyNote[]> {
  const readable = pages.filter((p) => p.status === "read" && p.text.length > 0);
  if (!readable.length) return [];
  const corpus = readable.map((p, i) => `### Page ${i + 1}: ${p.url}\n${p.text}`).join("\n\n");
  let raw = "";
  for await (const part of streamWithFallback(
    [
      {
        role: "system",
        content:
          "You extract facts about a company from its own website, for a sales rep writing an offer. " +
          "Return only facts stated on the pages: what the company does, who it serves, size, locations, history, products or services, notable customers, values, and anything that hints at needs or priorities. " +
          "Each fact is one short sentence. Never guess. " +
          "If the pages clearly belong to a different company than the one named, return exactly one note that says whose website it is and that it does not appear to be the named company's site. " +
          'Answer with JSON only: {"notes":[{"text":"...","source":"<page url>"}]} with 5 to 12 notes, most useful first.',
      },
      { role: "user", content: `Company: ${company}\n\n${corpus}` },
    ],
    0.2,
    signal,
  )) {
    if (part.type === "delta") raw += part.text;
  }
  const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  try {
    const parsed = JSON.parse(json) as { notes?: { text?: string; source?: string }[] };
    const urls = new Set(readable.map((p) => p.url));
    return (parsed.notes ?? [])
      .filter((n) => n.text)
      .map((n) => ({ text: n.text!.trim(), sourceUrl: n.source && urls.has(n.source) ? n.source : readable[0].url }));
  } catch {
    throw new Error("The AI answer about the company could not be read. Try reading the website again.");
  }
}

export function templateSections(body: string): string[] {
  return body
    .split("\n")
    .filter((l) => /^##\s+/.test(l))
    .map((l) => l.replace(/^##\s+/, "").trim());
}

export function streamOffer(
  input: {
    leadTitle: string;
    organizationName: string | null;
    personName: string | null;
    templateBody: string;
    notes: MeetingNote[];
    companyNotes: CompanyNote[];
  },
  signal?: AbortSignal,
): AsyncGenerator<StreamPart> {
  const company = input.organizationName || input.leadTitle;
  const notes = input.notes.length
    ? input.notes.map((n) => `- (${n.addTime.slice(0, 10)}) ${n.text}`).join("\n")
    : "None selected.";
  const facts = input.companyNotes.length
    ? input.companyNotes.map((n) => `- ${n.text} (${n.sourceUrl})`).join("\n")
    : "None. The website was not read.";

  return streamWithFallback(
    [
      {
        role: "system",
        content: [
          "You rewrite a sales offer template into a custom offer for one company.",
          "Rules:",
          "- Keep the template's structure: the same headings, in the same order, and its tables.",
          "- Replace every placeholder ({{company}}, [bracketed hints]) with specifics from the meeting notes and company facts.",
          "- Use only facts from the meeting notes and the company facts. Never invent numbers, names, dates or claims.",
          "- If a placeholder cannot be filled from the inputs, write [to confirm: what is missing] in its place.",
          "- Keep the template's prices and terms unless the meeting notes say otherwise.",
          "- Write in clear, warm, professional English, addressed to the customer as 'you'. No filler.",
          "- Output the finished offer as markdown only, starting with the # title. No preamble, no closing remarks.",
        ].join("\n"),
      },
      {
        role: "user",
        content: `Company: ${company}\nContact: ${input.personName ?? "unknown"}\nLead: ${input.leadTitle}\n\n## Meeting notes\n${notes}\n\n## Company facts from the website\n${facts}\n\n## Template\n${input.templateBody}`,
      },
    ],
    0.4,
    signal,
  );
}
