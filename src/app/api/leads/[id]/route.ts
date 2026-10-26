import { connection } from "next/server";
import { errorResponse } from "@/lib/http";
import { leadWithWebsite } from "@/lib/leads";

export async function GET(_request: Request, ctx: RouteContext<"/api/leads/[id]">) {
  await connection();
  try {
    const { id } = await ctx.params;
    const lead = await leadWithWebsite(id);
    if (!lead) return Response.json({ error: "This lead no longer exists in Pipedrive." }, { status: 404 });
    return Response.json({ lead });
  } catch (e) {
    return errorResponse(e);
  }
}
