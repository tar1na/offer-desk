import { connection } from "next/server";
import { deleteTemplate, getTemplate, updateTemplate } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export async function GET(_request: Request, ctx: RouteContext<"/api/templates/[id]">) {
  await connection();
  const { id } = await ctx.params;
  const template = getTemplate(Number(id));
  if (!template) return Response.json({ error: "Template not found." }, { status: 404 });
  return Response.json({ template });
}

export async function PUT(request: Request, ctx: RouteContext<"/api/templates/[id]">) {
  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as { name?: string; description?: string; body?: string };
    const name = body.name?.trim();
    if (!name) return Response.json({ error: "Give the template a name." }, { status: 400 });
    const template = updateTemplate(Number(id), { name, description: body.description?.trim() ?? "", body: body.body ?? "" });
    if (!template) return Response.json({ error: "Template not found." }, { status: 404 });
    return Response.json({ template });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/templates/[id]">) {
  const { id } = await ctx.params;
  deleteTemplate(Number(id));
  return new Response(null, { status: 204 });
}
