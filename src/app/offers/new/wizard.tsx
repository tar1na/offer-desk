"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Check, ChevronRight, CircleAlert, Globe, Loader2, NotebookText, PenLine, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Markdown } from "@/components/markdown";
import { notifyDataChanged } from "@/components/sidebar";
import { SourcesPanel } from "@/components/sources-panel";
import { Button, ErrorBanner, inputClass, Skeleton, Spinner } from "@/components/ui";
import { api, formatDate, formatMoney, hostOf, pathOf, readStream } from "@/lib/client";
import type { CompanyNote, Lead, LeadRow, MeetingNote, Template, WebsitePage } from "@/lib/types";

const STEPS = ["Lead", "Template", "Meeting notes", "Website", "Draft"] as const;

type SiteState =
  | { phase: "idle" }
  | { phase: "reading"; pages: (WebsitePage | { url: string; label: string; status: "reading" })[]; extracting: boolean }
  | { phase: "done"; pages: WebsitePage[]; companyNotes: CompanyNote[] }
  | { phase: "skipped" }
  | { phase: "failed"; message: string; pages: WebsitePage[] };

type SiteEvent =
  | { type: "page-start"; url: string; label: string }
  | { type: "page-done"; page: WebsitePage }
  | { type: "links"; urls: string[] }
  | { type: "extracting"; pages: number }
  | { type: "done"; pages: WebsitePage[]; companyNotes: CompanyNote[] }
  | { type: "error"; message: string };

type GenEvent =
  | { type: "stage"; stage: "preparing" | "writing"; sections?: string[] }
  | { type: "model"; model: string; fallbackFrom?: string }
  | { type: "delta"; text: string }
  | { type: "saved"; id: number }
  | { type: "error"; message: string };

export function Wizard() {
  // Next keeps this page alive (hidden) across navigations, so a finished wizard would
  // reopen at its old lead and step, and its draft step would generate again. Start a
  // fresh wizard for every new visit or lead; back/forward still restores the old one.
  const { bfcacheId } = useRouter();
  const lead = useSearchParams().get("lead");
  return <WizardFlow key={`${bfcacheId}:${lead ?? ""}`} initialLeadId={lead} />;
}

function WizardFlow({ initialLeadId }: { initialLeadId: string | null }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [leadId, setLeadId] = useState<string | null>(initialLeadId);
  const [leads, setLeads] = useState<LeadRow[] | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [notes, setNotes] = useState<MeetingNote[] | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<Set<number>>(new Set());
  const [website, setWebsite] = useState("");
  const [site, setSite] = useState<SiteState>({ phase: "idle" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ leads: LeadRow[] }>("/api/leads")
      .then((r) => setLeads(r.leads.filter((l) => !l.isArchived)))
      .catch((e: Error) => setError(e.message));
    api<{ templates: Template[] }>("/api/templates")
      .then((r) => {
        setTemplates(r.templates);
        setTemplateId((id) => id ?? r.templates[0]?.id ?? null);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!leadId) return;
    api<{ lead: Lead }>(`/api/leads/${leadId}`)
      .then((r) => {
        setLead(r.lead);
        setWebsite(r.lead.website ?? "");
      })
      .catch((e: Error) => setError(e.message));
    api<{ notes: MeetingNote[] }>(`/api/leads/${leadId}/notes`)
      .then((r) => {
        setNotes(r.notes);
        setSelectedNotes(new Set(r.notes.map((n) => n.id)));
      })
      .catch((e: Error) => setError(e.message));
  }, [leadId]);

  const template = templates?.find((t) => t.id === templateId) ?? null;
  const usedNotes = (notes ?? []).filter((n) => selectedNotes.has(n.id));
  const company = lead?.organizationName ?? lead?.title ?? "";

  const readSite = useCallback(async () => {
    const url = website.trim();
    if (!url || !leadId) return;
    setSite({ phase: "reading", pages: [], extracting: false });
    const pages: (WebsitePage | { url: string; label: string; status: "reading" })[] = [];
    try {
      await readStream<SiteEvent>("/api/website", { url, leadId, company }, (e) => {
        if (e.type === "page-start") {
          pages.push({ url: e.url, label: e.label, status: "reading" });
          setSite({ phase: "reading", pages: [...pages], extracting: false });
        } else if (e.type === "page-done") {
          const i = pages.findIndex((p) => p.status === "reading");
          if (i >= 0) pages[i] = e.page;
          else pages.push(e.page);
          setSite({ phase: "reading", pages: [...pages], extracting: false });
        } else if (e.type === "extracting") {
          setSite({ phase: "reading", pages: [...pages], extracting: true });
        } else if (e.type === "done") {
          if (!e.pages.some((p) => p.status === "read" && p.chars > 0)) {
            setSite({ phase: "failed", message: e.pages[0]?.error ?? "Nothing could be read from that site.", pages: e.pages });
          } else {
            setSite({ phase: "done", pages: e.pages, companyNotes: e.companyNotes });
          }
        } else if (e.type === "error") {
          setSite({ phase: "failed", message: e.message, pages: pages.filter((p): p is WebsitePage => p.status !== "reading") });
        }
      });
    } catch (e) {
      setSite({ phase: "failed", message: (e as Error).message, pages: [] });
    }
  }, [website, leadId, company]);

  const canContinue = [
    !!lead,
    !!template,
    notes !== null,
    site.phase === "done" || site.phase === "skipped" || site.phase === "failed",
    false,
  ][step];

  const sitePages = site.phase === "done" || site.phase === "failed" ? site.pages : [];
  const companyNotes = site.phase === "done" ? site.companyNotes : [];

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line px-8 text-[16px]">
        <Link href="/leads" className="text-muted hover:text-ink">
          Leads
        </Link>
        <ChevronRight className="size-4 text-muted" strokeWidth={1.75} aria-hidden />
        <span className="text-muted">{lead ? company : "…"}</span>
        <ChevronRight className="size-4 text-muted" strokeWidth={1.75} aria-hidden />
        <h1 className="font-semibold">New offer</h1>
      </header>

      <Stepper
        step={step}
        onStep={(i) => i < step && setStep(i)}
        summaries={[
          company,
          template?.name.replace(/\s*\(Sample\)$/, "") ?? "",
          notes ? `${selectedNotes.size} of ${notes.length} selected` : "",
          site.phase === "done" ? `${sitePages.filter((p) => p.status === "read").length} pages read` : site.phase === "skipped" ? "Skipped" : site.phase === "failed" ? "Not read" : "",
          "",
        ]}
      />

      {error && (
        <div className="px-8 pt-4">
          <ErrorBanner message={error} />
        </div>
      )}

      {step === 4 && lead && template ? (
        <DraftStep
          lead={lead}
          template={template}
          notes={usedNotes}
          website={site.phase === "skipped" ? null : website.trim() || null}
          pages={sitePages}
          companyNotes={companyNotes}
          onBack={() => setStep(3)}
          onSaved={(id) => {
            notifyDataChanged();
            router.replace(`/offers/${id}`);
          }}
        />
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1080px] px-8 py-8">
              {step === 0 && (
                <LeadStep
                  leads={leads}
                  leadId={leadId}
                  lead={lead}
                  onPick={(id) => {
                    if (id === leadId) return;
                    setLead(null);
                    setNotes(null);
                    setSite({ phase: "idle" });
                    setLeadId(id);
                  }}
                />
              )}
              {step === 1 && <TemplateStep templates={templates} templateId={templateId} onPick={setTemplateId} />}
              {step === 2 && (
                <NotesStep
                  leadId={leadId!}
                  notes={notes}
                  selected={selectedNotes}
                  onToggle={(id) =>
                    setSelectedNotes((s) => {
                      const next = new Set(s);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    })
                  }
                  onAdded={(note) => {
                    setNotes((n) => [note, ...(n ?? [])]);
                    setSelectedNotes((s) => new Set(s).add(note.id));
                  }}
                />
              )}
              {step === 3 && (
                <WebsiteStep
                  website={website}
                  onWebsite={(v) => {
                    setWebsite(v);
                    if (site.phase !== "reading") setSite({ phase: "idle" });
                  }}
                  site={site}
                  onRead={readSite}
                  onRemoveNote={(i) =>
                    site.phase === "done" && setSite({ ...site, companyNotes: site.companyNotes.filter((_, j) => j !== i) })
                  }
                />
              )}
            </div>
          </div>
          <footer className="flex h-[72px] shrink-0 items-center gap-3 border-t border-line px-8">
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="size-[18px]" strokeWidth={1.75} aria-hidden />
                Back
              </Button>
            )}
            <div className="flex-1" />
            {step === 3 && site.phase !== "done" && (
              <Button variant="ghost" onClick={() => { setSite({ phase: "skipped" }); setStep(4); }} disabled={site.phase === "reading"}>
                Skip website
              </Button>
            )}
            {step === 3 && site.phase !== "done" && site.phase !== "failed" ? (
              <Button variant="primary" onClick={readSite} disabled={!website.trim()} loading={site.phase === "reading"}>
                {site.phase !== "reading" && <Globe className="size-[18px]" strokeWidth={1.75} aria-hidden />}
                {site.phase === "reading" ? "Reading website" : "Read website"}
              </Button>
            ) : (
              <Button variant="primary" onClick={() => setStep(step + 1)} disabled={!canContinue}>
                {step === 3 ? (
                  <>
                    <PenLine className="size-[18px]" strokeWidth={1.75} aria-hidden />
                    Write offer
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="size-[18px]" strokeWidth={1.75} aria-hidden />
                  </>
                )}
              </Button>
            )}
          </footer>
        </>
      )}
    </div>
  );
}

function Stepper({ step, summaries, onStep }: { step: number; summaries: string[]; onStep: (i: number) => void }) {
  return (
    <ol className="flex shrink-0 items-stretch gap-2 overflow-x-auto border-b border-line px-4 py-3 md:px-8" aria-label="Steps">
      {STEPS.map((label, i) => {
        const state = i < step ? "done" : i === step ? "current" : "todo";
        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-2">
            <button
              onClick={() => onStep(i)}
              disabled={state !== "done"}
              aria-current={state === "current" ? "step" : undefined}
              className={`flex min-h-[56px] min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-1.5 text-left transition-colors duration-150 ${
                state === "current" ? "bg-accent-soft" : state === "done" ? "hover:bg-hover" : ""
              }`}
            >
              <span
                className={`tabular grid size-7 shrink-0 place-items-center rounded-full text-[14px] font-semibold ${
                  state === "done" ? "bg-accent text-white" : state === "current" ? "bg-accent text-white ring-4 ring-[#dcdcfb]" : "border border-line-strong bg-white text-muted"
                }`}
              >
                {state === "done" ? <Check className="size-4" strokeWidth={2.5} aria-label="Done" /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className={`block text-[15px] font-medium ${state === "todo" ? "text-muted" : "text-ink"}`}>{label}</span>
                {state === "done" && summaries[i] && <span className="block truncate text-[14px] text-muted">{summaries[i]}</span>}
              </span>
            </button>
            {i < STEPS.length - 1 && <span className={`h-px w-6 shrink-0 ${i < step ? "bg-accent" : "bg-line-strong"}`} aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

function StepTitle({ title, body }: { title: string; body: ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-[24px] font-semibold tracking-[-0.015em]">{title}</h2>
      <p className="mt-1 text-muted">{body}</p>
    </div>
  );
}

function RadioRow({ checked, onClick, children }: { checked: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      role="radio"
      aria-checked={checked}
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-lg border px-4 py-3.5 text-left transition-[border-color,background-color,box-shadow] duration-150 ${
        checked ? "border-accent bg-accent-soft shadow-[0_0_0_1px_var(--accent)]" : "border-line bg-white hover:border-line-strong"
      }`}
    >
      <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${checked ? "border-accent bg-accent" : "border-line-strong bg-white"}`} aria-hidden>
        {checked && <span className="size-2 rounded-full bg-white" />}
      </span>
      {children}
    </button>
  );
}

function LeadStep({ leads, leadId, lead, onPick }: { leads: LeadRow[] | null; leadId: string | null; lead: Lead | null; onPick: (id: string) => void }) {
  return (
    <>
      <StepTitle title="Which lead is this offer for?" body="Leads come straight from Pipedrive." />
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div role="radiogroup" aria-label="Lead" className="flex flex-col gap-2">
          {!leads
            ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[60px] w-full rounded-lg" />)
            : leads.map((l) => (
                <RadioRow key={l.id} checked={l.id === leadId} onClick={() => onPick(l.id)}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{l.title}</span>
                    <span className="block truncate text-[15px] text-muted">{[l.organizationName, l.personName].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="tabular text-ink-2">{formatMoney(l.value)}</span>
                </RadioRow>
              ))}
          {leads?.length === 0 && (
            <p className="text-muted">
              No leads yet. <Link href="/leads" className="text-ink underline">Add one on the Leads page.</Link>
            </p>
          )}
        </div>
        <div className="self-start rounded-lg border border-line bg-sidebar p-5">
          {lead ? (
            <dl className="flex flex-col gap-3">
              <div>
                <dt className="text-[14px] text-muted">Organization</dt>
                <dd className="font-medium">{lead.organizationName ?? "None"}</dd>
              </div>
              <div>
                <dt className="text-[14px] text-muted">Contact</dt>
                <dd>{lead.personName ?? "None"}</dd>
                {lead.personEmail && <dd className="text-[15px] text-muted">{lead.personEmail}</dd>}
              </div>
              <div>
                <dt className="text-[14px] text-muted">Value</dt>
                <dd className="tabular">{formatMoney(lead.value) || "Not set"}</dd>
              </div>
              <div>
                <dt className="text-[14px] text-muted">Website</dt>
                <dd>{lead.website ? hostOf(lead.website) : "Not known yet"}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-muted">{leadId ? "Loading lead…" : "Pick a lead to see its details."}</p>
          )}
        </div>
      </div>
    </>
  );
}

function TemplateStep({ templates, templateId, onPick }: { templates: Template[] | null; templateId: number | null; onPick: (id: number) => void }) {
  const selected = templates?.find((t) => t.id === templateId);
  return (
    <>
      <StepTitle
        title="Start from which template?"
        body={
          <>
            The offer keeps the sections and prices of the template.{" "}
            <Link href="/templates" className="text-ink underline">
              Manage templates
            </Link>
          </>
        }
      />
      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <div role="radiogroup" aria-label="Template" className="flex flex-col gap-2">
          {!templates
            ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[72px] w-full rounded-lg" />)
            : templates.map((t) => (
                <RadioRow key={t.id} checked={t.id === templateId} onClick={() => onPick(t.id)}>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{t.name}</span>
                    <span className="line-clamp-2 text-[15px] leading-snug text-muted">{t.description}</span>
                  </span>
                </RadioRow>
              ))}
        </div>
        <div className="max-h-[560px] overflow-y-auto rounded-lg border border-line bg-white px-8 py-7">
          {selected ? <Markdown>{selected.body}</Markdown> : <p className="text-muted">Pick a template to preview it.</p>}
        </div>
      </div>
    </>
  );
}

function NotesStep({
  leadId,
  notes,
  selected,
  onToggle,
  onAdded,
}: {
  leadId: string;
  notes: MeetingNote[] | null;
  selected: Set<number>;
  onToggle: (id: number) => void;
  onAdded: (n: MeetingNote) => void;
}) {
  const [composing, setComposing] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const open = composing || notes?.length === 0;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const { note } = await api<{ note: MeetingNote }>(`/api/leads/${leadId}/notes`, { method: "POST", body: JSON.stringify({ text }) });
      onAdded(note);
      setText("");
      setComposing(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <StepTitle title="Which meeting notes should shape the offer?" body="These are the lead's notes in Pipedrive. New notes are saved there too." />
      <div className="flex max-w-[820px] flex-col gap-3">
        {open ? (
          <div className="rounded-lg border border-line-strong bg-white p-4 shadow-[0_1px_2px_rgba(17,24,39,0.05)]">
            <label htmlFor="new-note" className="mb-2 block font-medium">
              {notes?.length === 0 ? "This lead has no notes yet. Add what you learned in the meeting." : "New meeting note"}
            </label>
            <textarea
              id="new-note"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="Who you met, what they need, budget, timeline, concerns…"
              className={`${inputClass} h-auto py-2.5 leading-relaxed`}
            />
            {error && <div className="mt-3"><ErrorBanner message={error} /></div>}
            <div className="mt-3 flex justify-end gap-2">
              {notes?.length !== 0 && (
                <Button variant="ghost" onClick={() => setComposing(false)}>
                  Cancel
                </Button>
              )}
              <Button variant="primary" onClick={save} loading={saving} disabled={!text.trim()}>
                Save to Pipedrive
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" className="self-start" onClick={() => setComposing(true)}>
            <Plus className="size-[18px]" strokeWidth={2} aria-hidden />
            Add meeting note
          </Button>
        )}
        {!notes
          ? Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
          : notes.map((n) => {
              const on = selected.has(n.id);
              return (
                <label
                  key={n.id}
                  className={`flex cursor-pointer gap-4 rounded-lg border px-4 py-3.5 transition-[border-color,background-color] duration-150 ${
                    on ? "border-accent bg-accent-soft" : "border-line bg-white hover:border-line-strong"
                  }`}
                >
                  <input type="checkbox" checked={on} onChange={() => onToggle(n.id)} className="mt-1 size-[18px] shrink-0 accent-[var(--accent)]" />
                  <span className="min-w-0 flex-1">
                    <span className="mb-1 flex items-center gap-2 text-[14px] text-muted">
                      <NotebookText className="size-4" strokeWidth={1.75} aria-hidden />
                      <span className="tabular">{formatDate(n.addTime)}</span>
                      {n.author && <span>· {n.author}</span>}
                    </span>
                    <span className="block whitespace-pre-line text-ink-2">{n.text}</span>
                  </span>
                </label>
              );
            })}
        {notes && notes.length > 0 && selected.size === 0 && (
          <p className="flex items-center gap-2 text-amber-ink">
            <CircleAlert className="size-4" strokeWidth={1.75} aria-hidden />
            No notes selected. The offer will lean on the template and the website only.
          </p>
        )}
      </div>
    </>
  );
}

function WebsiteStep({
  website,
  onWebsite,
  site,
  onRead,
  onRemoveNote,
}: {
  website: string;
  onWebsite: (v: string) => void;
  site: SiteState;
  onRead: () => void;
  onRemoveNote: (i: number) => void;
}) {
  const pages = site.phase === "reading" || site.phase === "done" || site.phase === "failed" ? site.pages : [];
  return (
    <>
      <StepTitle
        title="What does their website say about them?"
        body="Offer Desk reads the homepage and up to three pages about the company, then the AI writes down what it learned."
      />
      <div className="grid max-w-[980px] gap-8 lg:grid-cols-2">
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onRead();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Globe className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" strokeWidth={1.75} aria-hidden />
              <input
                value={website}
                onChange={(e) => onWebsite(e.target.value)}
                placeholder="company.com"
                aria-label="Company website"
                className={`${inputClass} pl-9`}
                disabled={site.phase === "reading"}
              />
            </div>
            {(site.phase === "done" || site.phase === "failed") && (
              <Button type="submit" variant="secondary">
                Read again
              </Button>
            )}
          </form>
          {pages.length > 0 && (
            <ol className="mt-5 flex flex-col">
              {pages.map((p, i) => (
                <li key={`${p.url}-${i}`} className="flex items-start gap-3 border-b border-line py-3 last:border-b-0">
                  <span className="mt-0.5">
                    {p.status === "reading" ? (
                      <Spinner className="size-[18px]" />
                    ) : p.status === "read" ? (
                      <Check className="size-[18px] text-green-ink" strokeWidth={2.25} aria-label="Read" />
                    ) : (
                      <CircleAlert className="size-[18px] text-amber-ink" strokeWidth={1.75} aria-label="Not read" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{"label" in p ? p.label : pathOf(p.url)}</span>
                    <span className="block truncate text-[14px] text-muted">
                      {p.status === "reading"
                        ? "Reading…"
                        : p.status === "read"
                          ? `${(p.title || hostOf(p.url)).slice(0, 60)} · ${p.chars.toLocaleString("en")} characters`
                          : p.error}
                    </span>
                  </span>
                </li>
              ))}
              {site.phase === "reading" && site.extracting && (
                <li className="flex items-center gap-3 py-3">
                  <Spinner className="size-[18px]" />
                  <span className="font-medium">Writing down what the pages say about the company…</span>
                </li>
              )}
            </ol>
          )}
          {site.phase === "failed" && (
            <div className="mt-4">
              <ErrorBanner message={`${site.message} You can try another address or write the offer without the website.`} />
            </div>
          )}
        </div>
        <div className="self-start rounded-lg border border-line bg-sidebar p-5">
          <h3 className="mb-3 flex items-center gap-2 font-medium">
            <Building2 className="size-[18px] text-muted" strokeWidth={1.75} aria-hidden />
            Company notes
          </h3>
          {site.phase === "done" ? (
            site.companyNotes.length ? (
              <ul className="flex flex-col gap-2.5">
                {site.companyNotes.map((n, i) => (
                  <li key={i} className="group flex items-start gap-2 text-[15px] leading-snug">
                    <span className="mt-[9px] size-1 shrink-0 rounded-full bg-muted" aria-hidden />
                    <span className="flex-1">
                      {n.text} <span className="text-[14px] whitespace-nowrap text-muted">{pathOf(n.sourceUrl)}</span>
                    </span>
                    <button
                      onClick={() => onRemoveNote(i)}
                      className="shrink-0 rounded px-1.5 text-[14px] text-muted opacity-0 group-hover:opacity-100 hover:bg-hover hover:text-ink focus-visible:opacity-100"
                    >
                      Leave out
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">The pages were read, but they said little about the company.</p>
            )
          ) : (
            <p className="text-muted">
              {site.phase === "reading" ? "Notes appear here once the pages are read." : "Read the website to collect facts the offer can use."}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function DraftStep({
  lead,
  template,
  notes,
  website,
  pages,
  companyNotes,
  onBack,
  onSaved,
}: {
  lead: Lead;
  template: Template;
  notes: MeetingNote[];
  website: string | null;
  pages: WebsitePage[];
  companyNotes: CompanyNote[];
  onBack: () => void;
  onSaved: (id: number) => void;
}) {
  const [text, setText] = useState("");
  const [sections, setSections] = useState<string[]>([]);
  const [stage, setStage] = useState<"preparing" | "writing" | "saving" | "failed">("preparing");
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState(0);
  const [fallback, setFallback] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);
  const savedId = useRef<number | null>(null);

  useEffect(() => {
    // Next re-runs this effect when a hidden page is shown again; never write a second draft.
    if (savedId.current !== null) return onSaved(savedId.current);
    const controller = new AbortController();
    abort.current = controller;
    let acc = "";
    readStream<GenEvent>(
      "/api/offers/generate",
      { leadId: lead.id, templateId: template.id, noteIds: notes.map((n) => n.id), website, pages, companyNotes },
      (e) => {
        if (e.type === "stage") {
          // "writing" starts when the model answers, so the readout never claims progress it hasn't made.
          if (e.sections) setSections(e.sections);
        } else if (e.type === "model") {
          setStage("writing");
          setFallback(e.fallbackFrom ? `${e.fallbackFrom} was slow to answer, so ${e.model} is writing this offer.` : null);
        } else if (e.type === "delta") {
          acc += e.text;
          setText(acc);
        } else if (e.type === "saved") {
          setStage("saving");
          savedId.current = e.id;
          onSaved(e.id);
        } else if (e.type === "error") {
          setError(e.message);
          setStage("failed");
        }
      },
      controller.signal,
    ).catch((e: Error) => {
      if (e.name === "AbortError") return;
      setError(e.message);
      setStage("failed");
    });
    return () => controller.abort();
    // Inputs are fixed for the life of this step; `run` restarts generation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  useEffect(() => {
    const el = scroller.current;
    if (el && stage === "writing") el.scrollTop = el.scrollHeight;
  }, [text, stage]);

  const written = useMemo(() => text.split("\n").filter((l) => /^##\s+/.test(l)).map((l) => l.replace(/^##\s+/, "").trim()), [text]);
  const current = Math.max(1, written.length);
  const total = Math.max(sections.length, written.length, 1);
  const pct = stage === "saving" ? 100 : stage === "writing" ? Math.min(96, Math.round(((current - 0.5) / total) * 100)) : 4;

  const readCount = pages.filter((p) => p.status === "read").length;
  const steps: { label: string; state: "done" | "active" | "todo" }[] = [
    ...(website && readCount
      ? [
          { label: `Read ${readCount} ${readCount === 1 ? "page" : "pages"}`, state: "done" as const },
          { label: `${companyNotes.length} company ${companyNotes.length === 1 ? "note" : "notes"}`, state: "done" as const },
        ]
      : [{ label: "No website", state: "done" as const }]),
    { label: `${notes.length} meeting ${notes.length === 1 ? "note" : "notes"}`, state: "done" },
    {
      label:
        stage === "preparing"
          ? "Waiting for the AI"
          : stage === "saving"
            ? "Saving draft"
            : `Writing section ${current} of ${total}${written[current - 1] ? `: ${written[current - 1]}` : ""}`,
      state: stage === "failed" ? "todo" : "active",
    },
  ];

  return (
    <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto] lg:grid-cols-[1fr_360px] lg:grid-rows-1">
      <div className="flex min-h-0 flex-col">
        <div className="shrink-0 border-b border-line px-8 py-4">
          <div className="flex min-w-0 items-center gap-2 text-[15px] whitespace-nowrap" aria-live="polite">
            {steps.map((s, i) => (
              <span key={i} className={`flex items-center gap-2 ${i === steps.length - 1 ? "min-w-0" : "shrink-0"}`}>
                {i > 0 && <ChevronRight className="size-4 text-line-strong" strokeWidth={2} aria-hidden />}
                {s.state === "done" ? (
                  <Check className="size-4 text-green-ink" strokeWidth={2.5} aria-hidden />
                ) : s.state === "active" ? (
                  <Loader2 className="size-4 animate-spin text-accent" strokeWidth={2.25} aria-hidden />
                ) : (
                  <CircleAlert className="size-4 text-red-ink" strokeWidth={2} aria-hidden />
                )}
                <span className={`truncate ${s.state === "active" ? "font-medium text-ink" : "text-ink-2"}`}>{s.label}</span>
              </span>
            ))}
          </div>
          {fallback && <p className="mt-2 text-[14px] text-muted">{fallback}</p>}
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-subtle" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Offer progress">
            {stage === "preparing" ? (
              <div className="h-full w-1/3 rounded-full bg-accent [animation:progress-slide_1.2s_ease-in-out_infinite]" />
            ) : (
              <div className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
            )}
          </div>
        </div>
        <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
          {error ? (
            <div className="max-w-[720px]">
              <ErrorBanner
                message={`${error} Your choices are kept.`}
                onRetry={() => {
                  setText("");
                  setError(null);
                  setStage("preparing");
                  setRun((r) => r + 1);
                }}
              />
            </div>
          ) : text ? (
            <>
              <Markdown>{text}</Markdown>
              {stage === "writing" && (
                <p className="mt-2 flex items-center gap-2 text-[15px] font-medium text-accent-ink" aria-hidden>
                  <span className="inline-block h-5 w-0.5 animate-pulse bg-accent" />
                  Writing {written[current - 1] ?? "the offer"}…
                </p>
              )}
            </>
          ) : (
            <div className="flex max-w-[640px] flex-col gap-3">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          )}
        </div>
        <div className="flex h-[72px] shrink-0 items-center gap-3 border-t border-line px-8">
          <Button
            variant="ghost"
            onClick={() => {
              abort.current?.abort();
              onBack();
            }}
            disabled={stage === "saving"}
          >
            <ArrowLeft className="size-[18px]" strokeWidth={1.75} aria-hidden />
            {stage === "failed" ? "Back" : "Stop and go back"}
          </Button>
          <div className="flex-1" />
          <p className="text-[15px] text-muted">{stage === "failed" ? "Nothing was saved." : "The draft opens for editing when it's done. Nothing is sent."}</p>
        </div>
      </div>
      <SourcesPanel
        templateName={template.name}
        notes={notes.map((n) => ({ id: n.id, addTime: n.addTime, excerpt: n.text }))}
        website={website}
        pages={pages}
        companyNotes={companyNotes}
      />
    </div>
  );
}
