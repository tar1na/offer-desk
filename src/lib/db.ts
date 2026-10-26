import "server-only";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { SAMPLE_TEMPLATES } from "./sample-templates";
import type { CompanyNote, Offer, OfferSources, Template, WebsitePage } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "offerdesk.db");

declare global {
  var __offerDeskDb: DatabaseSync | undefined;
}

function open(): DatabaseSync {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      is_sample INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id TEXT NOT NULL,
      lead_title TEXT NOT NULL,
      organization_name TEXT,
      template_id INTEGER,
      template_name TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      sources TEXT NOT NULL DEFAULT '{}',
      deal_id INTEGER,
      deal_note_id INTEGER,
      deal_file_id INTEGER,
      converted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS offers_lead ON offers(lead_id);
    CREATE TABLE IF NOT EXISTS lead_meta (
      lead_id TEXT PRIMARY KEY,
      website TEXT
    );
  `);
  const count = db.prepare("SELECT COUNT(*) AS n FROM templates").get() as { n: number };
  if (count.n === 0) {
    const insert = db.prepare(
      "INSERT INTO templates (name, description, body, is_sample, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)",
    );
    const now = new Date().toISOString();
    for (const t of SAMPLE_TEMPLATES) insert.run(t.name, t.description, t.body, now, now);
  }
  return db;
}

export function db(): DatabaseSync {
  globalThis.__offerDeskDb ??= open();
  return globalThis.__offerDeskDb;
}

type TemplateRow = {
  id: number;
  name: string;
  description: string;
  body: string;
  is_sample: number;
  created_at: string;
  updated_at: string;
};

function toTemplate(r: TemplateRow): Template {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    body: r.body,
    isSample: r.is_sample === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function listTemplates(): Template[] {
  const rows = db().prepare("SELECT * FROM templates ORDER BY updated_at DESC").all() as TemplateRow[];
  return rows.map(toTemplate);
}

export function getTemplate(id: number): Template | null {
  const row = db().prepare("SELECT * FROM templates WHERE id = ?").get(id) as TemplateRow | undefined;
  return row ? toTemplate(row) : null;
}

export function createTemplate(input: { name: string; description: string; body: string }): Template {
  const now = new Date().toISOString();
  const res = db()
    .prepare("INSERT INTO templates (name, description, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
    .run(input.name, input.description, input.body, now, now);
  return getTemplate(Number(res.lastInsertRowid))!;
}

export function updateTemplate(id: number, input: { name: string; description: string; body: string }): Template | null {
  db()
    .prepare("UPDATE templates SET name = ?, description = ?, body = ?, updated_at = ? WHERE id = ?")
    .run(input.name, input.description, input.body, new Date().toISOString(), id);
  return getTemplate(id);
}

export function deleteTemplate(id: number): void {
  db().prepare("DELETE FROM templates WHERE id = ?").run(id);
}

type OfferRow = {
  id: number;
  lead_id: string;
  lead_title: string;
  organization_name: string | null;
  template_id: number | null;
  template_name: string;
  title: string;
  body: string;
  status: string;
  sources: string;
  deal_id: number | null;
  deal_note_id: number | null;
  deal_file_id: number | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
};

function toOffer(r: OfferRow): Offer {
  return {
    id: r.id,
    leadId: r.lead_id,
    leadTitle: r.lead_title,
    organizationName: r.organization_name,
    templateId: r.template_id,
    templateName: r.template_name,
    title: r.title,
    body: r.body,
    status: r.status === "converted" ? "converted" : "draft",
    sources: JSON.parse(r.sources) as OfferSources,
    dealId: r.deal_id,
    dealNoteId: r.deal_note_id,
    dealFileId: r.deal_file_id,
    convertedAt: r.converted_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function listOffers(): Offer[] {
  const rows = db().prepare("SELECT * FROM offers ORDER BY updated_at DESC").all() as OfferRow[];
  return rows.map(toOffer);
}

export function listOffersForLeads(): Map<string, Offer[]> {
  const map = new Map<string, Offer[]>();
  for (const o of listOffers()) {
    const list = map.get(o.leadId) ?? [];
    list.push(o);
    map.set(o.leadId, list);
  }
  return map;
}

export function getOffer(id: number): Offer | null {
  const row = db().prepare("SELECT * FROM offers WHERE id = ?").get(id) as OfferRow | undefined;
  return row ? toOffer(row) : null;
}

export function createOffer(input: {
  leadId: string;
  leadTitle: string;
  organizationName: string | null;
  templateId: number | null;
  templateName: string;
  title: string;
  body: string;
  sources: OfferSources;
}): Offer {
  const now = new Date().toISOString();
  const res = db()
    .prepare(
      `INSERT INTO offers (lead_id, lead_title, organization_name, template_id, template_name, title, body, sources, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.leadId,
      input.leadTitle,
      input.organizationName,
      input.templateId,
      input.templateName,
      input.title,
      input.body,
      JSON.stringify(input.sources),
      now,
      now,
    );
  return getOffer(Number(res.lastInsertRowid))!;
}

export function updateOfferContent(id: number, input: { title: string; body: string }): Offer | null {
  db()
    .prepare("UPDATE offers SET title = ?, body = ?, updated_at = ? WHERE id = ?")
    .run(input.title, input.body, new Date().toISOString(), id);
  return getOffer(id);
}

export function markOfferConverted(
  id: number,
  input: { dealId: number; dealNoteId: number | null; dealFileId: number | null },
): Offer | null {
  const now = new Date().toISOString();
  db()
    .prepare(
      "UPDATE offers SET status = 'converted', deal_id = ?, deal_note_id = ?, deal_file_id = ?, converted_at = ?, updated_at = ? WHERE id = ?",
    )
    .run(input.dealId, input.dealNoteId, input.dealFileId, now, now, id);
  return getOffer(id);
}

export function deleteOffer(id: number): void {
  db().prepare("DELETE FROM offers WHERE id = ?").run(id);
}

export function getLeadWebsite(leadId: string): string | null {
  const row = db().prepare("SELECT website FROM lead_meta WHERE lead_id = ?").get(leadId) as
    | { website: string | null }
    | undefined;
  return row?.website ?? null;
}

export function setLeadWebsite(leadId: string, website: string | null): void {
  db()
    .prepare(
      "INSERT INTO lead_meta (lead_id, website) VALUES (?, ?) ON CONFLICT(lead_id) DO UPDATE SET website = excluded.website",
    )
    .run(leadId, website);
}

export type { CompanyNote, WebsitePage };
