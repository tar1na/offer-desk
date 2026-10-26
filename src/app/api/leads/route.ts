import { connection } from "next/server";
import { errorResponse } from "@/lib/http";
import { leadRows } from "@/lib/leads";
import { createLead } from "@/lib/pipedrive";
import { setLeadWebsite } from "@/lib/db";

export async function GET() {
  await connection();
  try {
    return Response.json({ leads: await leadRows() });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string;
      organizationName?: string;
      personName?: string;
      personEmail?: string;
      website?: string;
      value?: number | string;
      currency?: string;
    };
    const title = body.title?.trim();
    const organizationName = body.organizationName?.trim() || undefined;
    const personName = body.personName?.trim() || undefined;
    if (!title) return Response.json({ error: "Give the lead a title." }, { status: 400 });
    if (!organizationName && !personName) {
      return Response.json({ error: "Add an organization or a contact person. Pipedrive needs one of them." }, { status: 400 });
    }
    const value = body.value === "" || body.value == null ? undefined : Number(body.value);
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
      return Response.json({ error: "Value must be a positive number." }, { status: 400 });
    }
    const id = await createLead({
      title,
      organizationName,
      personName,
      personEmail: body.personEmail?.trim() || undefined,
      value,
      currency: body.currency || "EUR",
    });
    if (body.website?.trim()) setLeadWebsite(id, body.website.trim());
    return Response.json({ id }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
