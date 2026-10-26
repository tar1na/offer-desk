import { connection } from "next/server";
import { getOffer } from "@/lib/db";
import { renderOfferPdf, slugify } from "@/lib/pdf";

export async function GET(_request: Request, ctx: RouteContext<"/api/offers/[id]/pdf">) {
  await connection();
  const { id } = await ctx.params;
  const offer = getOffer(Number(id));
  if (!offer) return Response.json({ error: "Offer not found." }, { status: 404 });
  const pdf = await renderOfferPdf(offer.body, { title: offer.title, company: offer.organizationName ?? offer.leadTitle });
  return new Response(pdf as BodyInit, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${slugify(offer.title)}.pdf"`,
      "cache-control": "no-store",
    },
  });
}
