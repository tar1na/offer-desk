import { streamOffer, templateSections } from "@/lib/ai";
import { createOffer, getTemplate } from "@/lib/db";
import { ndjson } from "@/lib/http";
import { leadWithWebsite } from "@/lib/leads";
import { listLeadNotes } from "@/lib/pipedrive";
import type { CompanyNote, WebsitePage } from "@/lib/types";

type Body = {
  leadId?: string;
  templateId?: number;
  noteIds?: number[];
  website?: string | null;
  pages?: WebsitePage[];
  companyNotes?: CompanyNote[];
};

export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  if (!body.leadId || !body.templateId) {
    return Response.json({ error: "Pick a lead and a template first." }, { status: 400 });
  }
  const leadId = body.leadId;
  const templateId = body.templateId;

  return ndjson(async (send) => {
    send({ type: "stage", stage: "preparing" });
    const [lead, allNotes] = await Promise.all([leadWithWebsite(leadId), listLeadNotes(leadId)]);
    const template = getTemplate(templateId);
    if (!lead) throw new Error("This lead no longer exists in Pipedrive.");
    if (!template) throw new Error("That template was deleted. Pick another one.");
    const wanted = new Set(body.noteIds ?? []);
    const notes = allNotes.filter((n) => wanted.has(n.id));
    const companyNotes = body.companyNotes ?? [];

    send({ type: "stage", stage: "writing", sections: templateSections(template.body) });
    let text = "";
    let model = "";
    for await (const part of streamOffer(
      {
        leadTitle: lead.title,
        organizationName: lead.organizationName,
        personName: lead.personName,
        templateBody: template.body,
        notes,
        companyNotes,
      },
      request.signal,
    )) {
      if (request.signal.aborted) return;
      if (part.type === "model") {
        model = part.model;
        send(part);
        continue;
      }
      text += part.text;
      send({ type: "delta", text: part.text });
    }
    // The rep stopped or left the page: don't save a draft they never saw finish.
    if (request.signal.aborted) return;
    const markdown = text.trim();
    if (!markdown) throw new Error("The AI returned an empty offer. Try again.");
    const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || `Offer for ${lead.organizationName ?? lead.title}`;

    const offer = createOffer({
      leadId: lead.id,
      leadTitle: lead.title,
      organizationName: lead.organizationName,
      templateId: template.id,
      templateName: template.name,
      title,
      body: markdown,
      sources: {
        template: { id: template.id, name: template.name },
        notes: notes.map((n) => ({ id: n.id, addTime: n.addTime, excerpt: n.text })),
        website: body.website ?? null,
        pages: body.pages ?? [],
        companyNotes,
        model,
      },
    });
    send({ type: "saved", id: offer.id });
  });
}
