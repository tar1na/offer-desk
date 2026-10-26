import { connection } from "next/server";
import { getAccount, listLeads } from "@/lib/pipedrive";
import { listOffers, listTemplates } from "@/lib/db";

export async function GET() {
  await connection();
  const counts = { leads: null as number | null, offers: listOffers().length, templates: listTemplates().length };
  try {
    const [account, leads] = await Promise.all([getAccount(), listLeads()]);
    counts.leads = leads.filter((l) => !l.isArchived).length;
    return Response.json({ pipedrive: { connected: true, ...account }, counts });
  } catch (e) {
    return Response.json({ pipedrive: { connected: false, error: (e as Error).message }, counts });
  }
}
