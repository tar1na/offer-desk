import "server-only";
import { getLeadWebsite, listOffersForLeads } from "./db";
import * as pd from "./pipedrive";
import type { Lead, LeadRow } from "./types";

const FREE_MAIL = /^(gmail|googlemail|outlook|hotmail|live|yahoo|icloud|me|aol|proton|protonmail|gmx|mail)\.|^example\.(com|org|net)$/i;

/** Saved website for the lead, else a guess from the contact's work email domain. */
function websiteFor(lead: Omit<Lead, "website">): string | null {
  const saved = getLeadWebsite(lead.id);
  if (saved) return saved;
  const domain = lead.personEmail?.split("@")[1];
  return domain && !FREE_MAIL.test(domain) ? domain : null;
}

export async function leadRows(): Promise<LeadRow[]> {
  const [leads, offers] = [await pd.listLeads(), listOffersForLeads()];
  return leads.map((l) => {
    const list = offers.get(l.id) ?? [];
    return {
      ...l,
      website: websiteFor(l),
      offerCount: list.length,
      offerStatus: list.some((o) => o.status === "converted") ? "converted" : list.length ? "draft" : "none",
      latestOfferId: list[0]?.id ?? null,
    };
  });
}

export async function leadWithWebsite(id: string): Promise<Lead | null> {
  const lead = await pd.getLead(id);
  return lead ? { ...lead, website: websiteFor(lead) } : null;
}
