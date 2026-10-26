"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, Search, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { notifyDataChanged } from "@/components/sidebar";
import { compare, SortHeader, type Sort } from "@/components/sort-header";
import { Button, ButtonLink, EmptyState, ErrorBanner, Field, inputClass, PageHeader, Pill, Sheet, Skeleton } from "@/components/ui";
import { api, formatDate, formatMoney, parseDate } from "@/lib/client";
import type { LeadRow } from "@/lib/types";

type SortKey = "title" | "organization" | "value" | "added";

export function LeadsView() {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort<SortKey>>({ key: "added", dir: "desc" });
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    api<{ leads: LeadRow[] }>("/api/leads")
      .then((r) => setLeads(r.leads.filter((l) => !l.isArchived)))
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  const rows = useMemo(() => {
    if (!leads) return [];
    const q = query.trim().toLowerCase();
    const filtered = q
      ? leads.filter((l) => [l.title, l.organizationName, l.personName].some((v) => v?.toLowerCase().includes(q)))
      : leads;
    const value = (l: LeadRow) =>
      sort.key === "title"
        ? l.title
        : sort.key === "organization"
          ? l.organizationName
          : sort.key === "value"
            ? (l.value?.amount ?? null)
            : parseDate(l.addTime).getTime();
    const sorted = [...filtered].sort((a, b) => compare(value(a), value(b)));
    return sort.dir === "desc" ? sorted.reverse() : sorted;
  }, [leads, query, sort]);

  return (
    <>
      <PageHeader
        title="Leads"
        count={leads?.length}
        actions={
          <Button variant="primary" onClick={() => setAdding(true)}>
            <Plus className="size-[18px]" strokeWidth={2} aria-hidden />
            Add lead
          </Button>
        }
      />
      {error ? (
        <div className="p-8">
          <ErrorBanner
            message={error}
            onRetry={() => {
              setError(null);
              load();
            }}
          />
        </div>
      ) : leads && leads.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" strokeWidth={1.75} />}
          title="No leads in Pipedrive yet"
          body="Add a lead here and it is created in Pipedrive, ready for its first offer."
          action={
            <Button variant="primary" onClick={() => setAdding(true)}>
              <Plus className="size-[18px]" strokeWidth={2} aria-hidden />
              Add lead
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex items-center gap-3 px-8 py-4">
            <div className="relative w-[320px]">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" strokeWidth={2} aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search leads, companies, contacts"
                aria-label="Search leads"
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left md:min-w-[880px]">
            <thead>
              <tr>
                <SortHeader label="Lead" k="title" sort={sort} onSort={setSort} />
                <SortHeader label="Organization" k="organization" sort={sort} onSort={setSort} className="hidden sm:table-cell" />
                <th scope="col" className="hidden h-11 border-b border-line px-3 text-[14px] font-medium text-muted md:table-cell">Contact</th>
                <SortHeader label="Value" k="value" sort={sort} onSort={setSort} align="right" className="hidden text-right sm:table-cell" />
                <th scope="col" className="h-11 border-b border-line px-3 text-[14px] font-medium text-muted">Offer</th>
                <SortHeader label="Added" k="added" sort={sort} onSort={setSort} className="hidden xl:table-cell" />
                <th scope="col" className="hidden h-11 border-b border-line px-3 pr-8 md:table-cell"><span className="sr-only">Actions</span></th>
                <th scope="col" className="h-11 border-b border-line md:hidden"><span className="sr-only">Create offer</span></th>
              </tr>
            </thead>
            <tbody>
              {!leads
                ? Array.from({ length: 6 }, (_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }, (_, j) => (
                        <td key={j} className={`h-[52px] border-b border-line px-3 first:pl-8 last:pr-8 ${j === 5 ? "hidden xl:table-cell" : j === 1 || j === 3 ? "hidden sm:table-cell" : j === 2 || j === 6 ? "hidden md:table-cell" : ""}`}>
                          <Skeleton className="h-4 w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map((l) => (
                    <tr
                      key={l.id}
                      onClick={() => router.push(`/offers/new?lead=${l.id}`)}
                      className="group cursor-pointer transition-colors duration-100 hover:bg-[#fafafb]"
                    >
                      <td className="h-[52px] border-b border-line px-3 pl-8 font-medium">{l.title}</td>
                      <td className="hidden border-b border-line px-3 whitespace-nowrap text-ink-2 sm:table-cell">{l.organizationName ?? <span className="text-muted">—</span>}</td>
                      <td className="hidden border-b border-line px-3 whitespace-nowrap text-ink-2 md:table-cell">{l.personName ?? <span className="text-muted">—</span>}</td>
                      <td className="tabular hidden border-b border-line px-3 text-right whitespace-nowrap text-ink-2 sm:table-cell">{formatMoney(l.value)}</td>
                      <td className="border-b border-line px-3 whitespace-nowrap">
                        {l.offerStatus === "none" ? (
                          <span className="text-muted" aria-label="No offer yet">—</span>
                        ) : (
                          <Link href={`/offers/${l.latestOfferId}`} onClick={(e) => e.stopPropagation()} className="rounded-md">
                            <Pill tone={l.offerStatus === "converted" ? "converted" : "draft"}>
                              {l.offerStatus === "converted" ? "Converted" : l.offerCount > 1 ? `${l.offerCount} drafts` : "Draft"}
                            </Pill>
                          </Link>
                        )}
                      </td>
                      <td className="tabular hidden border-b border-line px-3 whitespace-nowrap text-ink-2 xl:table-cell">{formatDate(l.addTime)}</td>
                      <td className="hidden border-b border-line px-3 pr-8 text-right md:table-cell" onClick={(e) => e.stopPropagation()}>
                        <ButtonLink href={`/offers/new?lead=${l.id}`} size="sm" variant="secondary">
                          Create offer
                        </ButtonLink>
                      </td>
                      <td className="border-b border-line pr-4 text-right md:hidden">
                        <Link href={`/offers/new?lead=${l.id}`} aria-label={`Create offer for ${l.organizationName ?? l.title}`} className="inline-grid size-9 place-items-center rounded-lg text-muted hover:bg-hover">
                          <ChevronRight className="size-5" strokeWidth={1.75} aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  ))}
              {leads && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-12 text-center text-muted">
                    No leads match “{query}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </>
      )}
      <AddLeadSheet
        open={adding}
        onClose={() => setAdding(false)}
        onCreated={() => {
          setAdding(false);
          load();
          notifyDataChanged();
        }}
      />
    </>
  );
}

const EMPTY_FORM = { title: "", organizationName: "", personName: "", personEmail: "", website: "", value: "" };

function AddLeadSheet({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const close = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api("/api/leads", { method: "POST", body: JSON.stringify(form) });
      setForm(EMPTY_FORM);
      onCreated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      title="Add lead"
      onClose={close}
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="add-lead" loading={saving}>
            Create in Pipedrive
          </Button>
        </>
      }
    >
      <form id="add-lead" onSubmit={submit} className="flex flex-col gap-5">
        <Field label="Lead title">
          <input required autoFocus value={form.title} onChange={set("title")} placeholder="e.g. IT support for three depots" className={inputClass} />
        </Field>
        <Field label="Organization" hint="Created in Pipedrive if it's new.">
          <input value={form.organizationName} onChange={set("organizationName")} placeholder="Company name" className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact person">
            <input value={form.personName} onChange={set("personName")} placeholder="Full name" className={inputClass} />
          </Field>
          <Field label="Contact email">
            <input type="email" value={form.personEmail} onChange={set("personEmail")} placeholder="name@company.com" className={inputClass} />
          </Field>
        </div>
        <Field label="Website" hint="Used later to read about the company. Kept in Offer Desk.">
          <input value={form.website} onChange={set("website")} placeholder="company.com" className={inputClass} />
        </Field>
        <Field label="Value (EUR)">
          <input inputMode="numeric" value={form.value} onChange={set("value")} placeholder="0" className={`${inputClass} tabular`} />
        </Field>
        {error && <ErrorBanner message={error} />}
      </form>
    </Sheet>
  );
}
