import "server-only";
import type { Lead, MeetingNote } from "./types";

const BASE = "https://api.pipedrive.com";

export class PipedriveError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function token(): string {
  const key = process.env.PIPEDRIVE_API_KEY;
  if (!key) throw new PipedriveError("PIPEDRIVE_API_KEY is not set in .env", 500);
  return key;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "x-api-token": token(), accept: "application/json", ...(init.headers ?? {}) },
    cache: "no-store",
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.success === false) {
    const msg =
      res.status === 401
        ? "Pipedrive rejected the API key. Check PIPEDRIVE_API_KEY in .env."
        : body?.error || body?.message || `Pipedrive request failed (${res.status})`;
    throw new PipedriveError(msg, res.status);
  }
  return body as T;
}

function json(method: string, data: unknown): RequestInit {
  return { method, headers: { "content-type": "application/json" }, body: JSON.stringify(data) };
}

type RawLead = {
  id: string;
  title: string;
  organization_id: number | null;
  person_id: number | null;
  value: { amount: number; currency: string } | null;
  add_time: string;
  is_archived: boolean;
};

type RawOrg = { id: number; name: string };
type RawPerson = { id: number; name: string; emails?: { value: string; primary?: boolean }[] };

async function orgsById(ids: number[]): Promise<Map<number, RawOrg>> {
  const map = new Map<number, RawOrg>();
  if (!ids.length) return map;
  const res = await request<{ data: RawOrg[] | null }>(`/api/v2/organizations?ids=${ids.join(",")}&limit=500`);
  for (const o of res.data ?? []) map.set(o.id, o);
  return map;
}

async function personsById(ids: number[]): Promise<Map<number, RawPerson>> {
  const map = new Map<number, RawPerson>();
  if (!ids.length) return map;
  const res = await request<{ data: RawPerson[] | null }>(`/api/v2/persons?ids=${ids.join(",")}&limit=500`);
  for (const p of res.data ?? []) map.set(p.id, p);
  return map;
}

function primaryEmail(p: RawPerson | undefined): string | null {
  if (!p?.emails?.length) return null;
  return (p.emails.find((e) => e.primary) ?? p.emails[0]).value || null;
}

async function hydrate(raw: RawLead[]): Promise<Omit<Lead, "website">[]> {
  const orgIds = [...new Set(raw.map((l) => l.organization_id).filter((x): x is number => !!x))];
  const personIds = [...new Set(raw.map((l) => l.person_id).filter((x): x is number => !!x))];
  const [orgs, persons] = await Promise.all([orgsById(orgIds), personsById(personIds)]);
  return raw.map((l) => {
    const person = l.person_id ? persons.get(l.person_id) : undefined;
    return {
      id: l.id,
      title: l.title,
      organizationId: l.organization_id,
      organizationName: l.organization_id ? (orgs.get(l.organization_id)?.name ?? null) : null,
      personId: l.person_id,
      personName: person?.name ?? null,
      personEmail: primaryEmail(person),
      value: l.value,
      addTime: l.add_time,
      isArchived: l.is_archived,
    };
  });
}

export async function listLeads(): Promise<Omit<Lead, "website">[]> {
  const res = await request<{ data: RawLead[] | null }>(`/v1/leads?limit=500&archived_status=all&sort=add_time DESC`);
  return hydrate(res.data ?? []);
}

export async function getLead(id: string): Promise<Omit<Lead, "website"> | null> {
  try {
    const res = await request<{ data: RawLead }>(`/v1/leads/${encodeURIComponent(id)}`);
    const [lead] = await hydrate([res.data]);
    return lead;
  } catch (e) {
    if (e instanceof PipedriveError && e.status === 404) return null;
    throw e;
  }
}

export async function createLead(input: {
  title: string;
  organizationName?: string;
  personName?: string;
  personEmail?: string;
  value?: number;
  currency?: string;
}): Promise<string> {
  let organizationId: number | undefined;
  let personId: number | undefined;
  if (input.organizationName) {
    const org = await request<{ data: { id: number } }>(`/api/v2/organizations`, json("POST", { name: input.organizationName }));
    organizationId = org.data.id;
  }
  if (input.personName) {
    const person = await request<{ data: { id: number } }>(
      `/api/v2/persons`,
      json("POST", {
        name: input.personName,
        org_id: organizationId,
        emails: input.personEmail ? [{ value: input.personEmail, primary: true, label: "work" }] : undefined,
      }),
    );
    personId = person.data.id;
  }
  const lead = await request<{ data: { id: string } }>(
    `/v1/leads`,
    json("POST", {
      title: input.title,
      organization_id: organizationId,
      person_id: personId,
      value: input.value ? { amount: input.value, currency: input.currency || "EUR" } : undefined,
    }),
  );
  return lead.data.id;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type RawNote = {
  id: number;
  content: string;
  add_time: string;
  update_time: string | null;
  user?: { name?: string } | null;
};

export async function listLeadNotes(leadId: string): Promise<MeetingNote[]> {
  const res = await request<{ data: RawNote[] | null }>(
    `/v1/notes?lead_id=${encodeURIComponent(leadId)}&limit=100&sort=add_time DESC`,
  );
  return (res.data ?? []).map((n) => ({
    id: n.id,
    content: n.content,
    text: stripHtml(n.content),
    addTime: n.add_time,
    updateTime: n.update_time,
    author: n.user?.name ?? null,
  }));
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function textToNoteHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export async function addLeadNote(leadId: string, text: string): Promise<MeetingNote> {
  const res = await request<{ data: RawNote }>(`/v1/notes`, json("POST", { content: textToNoteHtml(text), lead_id: leadId }));
  const n = res.data;
  return {
    id: n.id,
    content: n.content,
    text: stripHtml(n.content),
    addTime: n.add_time,
    updateTime: n.update_time,
    author: n.user?.name ?? null,
  };
}

export async function addDealNote(dealId: number, html: string): Promise<number> {
  const res = await request<{ data: { id: number } }>(`/v1/notes`, json("POST", { content: html, deal_id: dealId }));
  return res.data.id;
}

export async function uploadDealFile(dealId: number, filename: string, data: Uint8Array, type: string): Promise<number> {
  const form = new FormData();
  form.append("file", new Blob([data as BlobPart], { type }), filename);
  form.append("deal_id", String(dealId));
  const res = await request<{ data: { id: number } }>(`/v1/files`, { method: "POST", body: form });
  return res.data.id;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Converts a lead to a deal with Pipedrive's conversion job and waits for it to finish. */
export async function convertLeadToDeal(leadId: string): Promise<number> {
  const start = await request<{ data: { conversion_id: string } }>(
    `/api/v2/leads/${encodeURIComponent(leadId)}/convert/deal`,
    json("POST", {}),
  );
  const conversionId = start.data.conversion_id;
  for (let i = 0; i < 30; i++) {
    await sleep(i < 5 ? 500 : 1000);
    const status = await request<{ data: { status: string; deal_id?: number | null } }>(
      `/api/v2/leads/${encodeURIComponent(leadId)}/convert/status/${conversionId}`,
    );
    if (status.data.status === "completed" && status.data.deal_id) return status.data.deal_id;
    if (status.data.status === "failed" || status.data.status === "rejected") {
      throw new PipedriveError("Pipedrive could not convert this lead to a deal.", 502);
    }
  }
  throw new PipedriveError("Pipedrive is still converting the lead. Check Pipedrive in a minute.", 504);
}

let companyDomain: string | null = null;

export async function getAccount(): Promise<{ companyDomain: string; companyName: string; userName: string }> {
  const res = await request<{ data: { company_domain: string; company_name: string; name: string } }>(`/v1/users/me`);
  companyDomain = res.data.company_domain;
  return { companyDomain: res.data.company_domain, companyName: res.data.company_name, userName: res.data.name };
}

export async function dealUrl(dealId: number): Promise<string> {
  if (!companyDomain) await getAccount();
  return `https://${companyDomain}.pipedrive.com/deal/${dealId}`;
}
