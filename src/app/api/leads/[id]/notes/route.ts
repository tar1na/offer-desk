import { connection } from "next/server";
import { errorResponse } from "@/lib/http";
import { addLeadNote, listLeadNotes } from "@/lib/pipedrive";

export async function GET(_request: Request, ctx: RouteContext<"/api/leads/[id]/notes">) {
  await connection();
  try {
    const { id } = await ctx.params;
    return Response.json({ notes: await listLeadNotes(id) });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: Request, ctx: RouteContext<"/api/leads/[id]/notes">) {
  try {
    const { id } = await ctx.params;
    const { text } = (await request.json()) as { text?: string };
    if (!text?.trim()) return Response.json({ error: "The note is empty." }, { status: 400 });
    return Response.json({ note: await addLeadNote(id, text.trim()) }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
