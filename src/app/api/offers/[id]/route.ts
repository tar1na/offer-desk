import { connection } from "next/server";
import { deleteOffer, getOffer, updateOfferContent } from "@/lib/db";
import { dealUrl } from "@/lib/pipedrive";

export async function GET(_request: Request, ctx: RouteContext<"/api/offers/[id]">) {
  await connection();
  const { id } = await ctx.params;
  const offer = getOffer(Number(id));
  if (!offer) return Response.json({ error: "Offer not found." }, { status: 404 });
  const link = offer.dealId ? await dealUrl(offer.dealId).catch(() => null) : null;
  return Response.json({ offer, dealUrl: link });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/offers/[id]">) {
  const { id } = await ctx.params;
  const body = (await request.json()) as { title?: string; body?: string };
  const existing = getOffer(Number(id));
  if (!existing) return Response.json({ error: "Offer not found." }, { status: 404 });
  const offer = updateOfferContent(existing.id, {
    title: body.title?.trim() || existing.title,
    body: body.body ?? existing.body,
  });
  return Response.json({ offer });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/offers/[id]">) {
  const { id } = await ctx.params;
  deleteOffer(Number(id));
  return new Response(null, { status: 204 });
}
