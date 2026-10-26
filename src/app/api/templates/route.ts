import { connection } from "next/server";
import { createTemplate, listTemplates } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export async function GET() {
  await connection();
  return Response.json({ templates: listTemplates() });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; description?: string; body?: string };
    const name = body.name?.trim();
    if (!name) return Response.json({ error: "Give the template a name." }, { status: 400 });
    const template = createTemplate({ name, description: body.description?.trim() ?? "", body: body.body ?? "" });
    return Response.json({ template }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
