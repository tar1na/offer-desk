"use client";

import { useRouter } from "next/navigation";
import { FileText, Globe, NotebookText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { compare, SortHeader, type Sort } from "@/components/sort-header";
import { ButtonLink, EmptyState, ErrorBanner, PageHeader, Pill, Skeleton } from "@/components/ui";
import { api, formatDate, hostOf } from "@/lib/client";
import type { Offer } from "@/lib/types";

type SortKey = "title" | "company" | "status" | "updated";
type Filter = "all" | "draft" | "converted";

export function OffersView() {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort<SortKey>>({ key: "updated", dir: "desc" });

  useEffect(() => {
    api<{ offers: Offer[] }>("/api/offers")
      .then((r) => setOffers(r.offers))
      .catch((e: Error) => setError(e.message));
  }, []);

  const rows = useMemo(() => {
    const list = (offers ?? []).filter((o) => filter === "all" || o.status === filter);
    const value = (o: Offer) =>
      sort.key === "title" ? o.title : sort.key === "company" ? (o.organizationName ?? o.leadTitle) : sort.key === "status" ? o.status : o.updatedAt;
    const sorted = [...list].sort((a, b) => compare(value(a), value(b)));
    return sort.dir === "desc" ? sorted.reverse() : sorted;
  }, [offers, filter, sort]);

  const counts = { all: offers?.length ?? 0, draft: offers?.filter((o) => o.status === "draft").length ?? 0, converted: offers?.filter((o) => o.status === "converted").length ?? 0 };

  return (
    <>
      <PageHeader title="Offers" count={offers?.length} actions={<ButtonLink href="/offers/new" variant="primary">New offer</ButtonLink>} />
      {error ? (
        <div className="p-8">
          <ErrorBanner message={error} />
        </div>
      ) : offers && offers.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-5" strokeWidth={1.75} />}
          title="No offers yet"
          body="Pick a lead and Offer Desk writes a custom offer from your template, the meeting notes and the company's website."
          action={<ButtonLink href="/leads" variant="primary">Go to leads</ButtonLink>}
        />
      ) : (
        <>
          <div className="flex items-center gap-1 px-8 py-4" role="tablist" aria-label="Filter offers">
            {(["all", "draft", "converted"] as const).map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={`h-9 rounded-lg px-3 text-[15px] font-medium transition-colors duration-150 ${filter === f ? "bg-subtle text-ink" : "text-muted hover:text-ink"}`}
              >
                {f === "all" ? "All" : f === "draft" ? "Drafts" : "Converted"} <span className="tabular ml-1 text-muted">{counts[f]}</span>
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead>
              <tr>
                <SortHeader label="Offer" k="title" sort={sort} onSort={setSort} />
                <SortHeader label="Company" k="company" sort={sort} onSort={setSort} />
                <th scope="col" className="h-11 border-b border-line px-3 text-[14px] font-medium text-muted">Template</th>
                <th scope="col" className="h-11 border-b border-line px-3 text-[14px] font-medium text-muted">Sources</th>
                <SortHeader label="Status" k="status" sort={sort} onSort={setSort} />
                <SortHeader label="Updated" k="updated" sort={sort} onSort={setSort} />
              </tr>
            </thead>
            <tbody>
              {!offers
                ? Array.from({ length: 5 }, (_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }, (_, j) => (
                        <td key={j} className="h-[52px] border-b border-line px-3 first:pl-8 last:pr-8">
                          <Skeleton className="h-4 w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map((o) => (
                    <tr key={o.id} onClick={() => router.push(`/offers/${o.id}`)} className="cursor-pointer transition-colors duration-100 hover:bg-[#fafafb]">
                      <td className="h-[52px] max-w-[420px] truncate border-b border-line px-3 pl-8 font-medium">{o.title}</td>
                      <td className="border-b border-line px-3 text-ink-2">{o.organizationName ?? o.leadTitle}</td>
                      <td className="border-b border-line px-3 text-ink-2">{o.templateName}</td>
                      <td className="border-b border-line px-3 text-ink-2">
                        <span className="flex items-center gap-4 text-[15px]">
                          <span className="tabular flex items-center gap-1.5" title="Meeting notes">
                            <NotebookText className="size-4 text-muted" strokeWidth={1.75} aria-hidden />
                            {o.sources.notes.length}
                            <span className="sr-only">meeting notes</span>
                          </span>
                          {o.sources.website && (
                            <span className="flex items-center gap-1.5" title="Website">
                              <Globe className="size-4 text-muted" strokeWidth={1.75} aria-hidden />
                              {hostOf(o.sources.website)}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="border-b border-line px-3">
                        <Pill tone={o.status === "converted" ? "converted" : "draft"}>{o.status === "converted" ? "Converted" : "Draft"}</Pill>
                      </td>
                      <td className="tabular border-b border-line px-3 pr-8 text-ink-2">{formatDate(o.updatedAt)}</td>
                    </tr>
                  ))}
              {offers && offers.length > 0 && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-muted">
                    No {filter === "draft" ? "drafts" : "converted offers"} yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </>
      )}
    </>
  );
}
