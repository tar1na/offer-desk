import { getOffer, markOfferConverted } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { markdownToHtml, renderOfferPdf, slugify } from "@/lib/pdf";
import { addDealNote, convertLeadToDeal, dealUrl, uploadDealFile } from "@/lib/pipedrive";

export async function POST(_request: Request, ctx: RouteContext<"/api/offers/[id]/convert">) {
  const { id } = await ctx.params;
  const offer = getOffer(Number(id));
  if (!offer) return Response.json({ error: "Offer not found." }, { status: 404 });
  if (offer.status === "converted" && offer.dealId) {
    return Response.json({ offer, dealUrl: await dealUrl(offer.dealId).catch(() => null) });
  }
  try {
    const dealId = await convertLeadToDeal(offer.leadId);
    const noteId = await addDealNote(dealId, markdownToHtml(offer.body));
    const pdf = await renderOfferPdf(offer.body, { title: offer.title, company: offer.organizationName ?? offer.leadTitle });
    const fileId = await uploadDealFile(dealId, `${slugify(offer.title)}.pdf`, pdf, "application/pdf");
    const updated = markOfferConverted(offer.id, { dealId, dealNoteId: noteId, dealFileId: fileId });
    return Response.json({ offer: updated, dealUrl: await dealUrl(dealId) });
  } catch (e) {
    return errorResponse(e);
  }
}
