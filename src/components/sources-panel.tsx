"use client";

import { Building2, CircleAlert, Globe, LayoutTemplate, NotebookText, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { formatDate, hostOf, pathOf } from "@/lib/client";
import type { CompanyNote, WebsitePage } from "@/lib/types";

function Section({ icon, title, count, children }: { icon: ReactNode; title: string; count?: number; children: ReactNode }) {
  return (
    <section className="border-b border-line px-5 py-4 last:border-b-0">
      <h3 className="mb-2.5 flex items-center gap-2 text-[14px] font-medium text-muted">
        {icon}
        {title}
        {count !== undefined && <span className="tabular">· {count}</span>}
      </h3>
      {children}
    </section>
  );
}

function NoteItem({ addTime, text }: { addTime: string; text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 150;
  return (
    <li className="rounded-lg border border-line bg-white px-3 py-2.5">
      <p className="tabular text-[14px] text-muted">{formatDate(addTime)}</p>
      <p className={`text-[15px] leading-snug whitespace-pre-line text-ink-2 ${open ? "" : "line-clamp-3"}`}>{text}</p>
      {long && (
        <button onClick={() => setOpen(!open)} aria-expanded={open} className="mt-1 text-[14px] font-medium text-ink-2 underline decoration-line-strong underline-offset-[3px] hover:decoration-ink-2">
          {open ? "Show less" : "Show the whole note"}
        </button>
      )}
    </li>
  );
}

export function SourcesPanel({
  templateName,
  notes,
  website,
  pages,
  companyNotes,
  onRemoveCompanyNote,
  footer,
}: {
  templateName: string | null;
  notes: { id: number; addTime: string; excerpt: string }[];
  website: string | null;
  pages: WebsitePage[];
  companyNotes: CompanyNote[];
  onRemoveCompanyNote?: (index: number) => void;
  footer?: ReactNode;
}) {
  const iconCls = "size-4 text-muted";
  return (
    <aside className="flex max-h-[32vh] flex-col overflow-y-auto border-t border-line bg-sidebar lg:max-h-none lg:border-t-0 lg:border-l" aria-label="Sources">
      <div className="flex h-12 shrink-0 items-center border-b border-line px-5">
        <h2 className="text-[16px] font-semibold">Built from</h2>
      </div>
      <Section icon={<LayoutTemplate className={iconCls} strokeWidth={1.75} />} title="Template">
        <p className="font-medium">{templateName ?? "Not picked yet"}</p>
      </Section>
      <Section icon={<NotebookText className={iconCls} strokeWidth={1.75} />} title="Meeting notes" count={notes.length}>
        {notes.length ? (
          <ul className="flex flex-col gap-2.5">
            {notes.map((n) => (
              <NoteItem key={n.id} addTime={n.addTime} text={n.excerpt} />
            ))}
          </ul>
        ) : (
          <p className="text-muted">None used.</p>
        )}
      </Section>
      <Section icon={<Globe className={iconCls} strokeWidth={1.75} />} title="Website pages" count={pages.filter((p) => p.status === "read").length}>
        {pages.length ? (
          <ul className="flex flex-col gap-1.5">
            {pages.map((p) => (
              <li key={p.url} className="flex items-start gap-2 text-[15px]">
                {p.status === "read" ? (
                  <a href={p.url} target="_blank" rel="noreferrer" className="min-w-0 truncate text-ink-2 underline decoration-line-strong underline-offset-[3px] hover:decoration-ink-2">
                    {p.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                  </a>
                ) : (
                  <span className="flex min-w-0 items-start gap-1.5 text-muted">
                    <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                    <span className="truncate">
                      {pathOf(p.url)}: {p.error ?? "not read"}
                    </span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">{website ? `${hostOf(website)} not read yet.` : "No website used."}</p>
        )}
      </Section>
      <Section icon={<Building2 className={iconCls} strokeWidth={1.75} />} title="Company notes from the website" count={companyNotes.length}>
        {companyNotes.length ? (
          <ul className="flex flex-col gap-2">
            {companyNotes.map((n, i) => (
              <li key={i} className="group flex items-start gap-2 text-[15px] leading-snug">
                <span className="mt-[9px] size-1 shrink-0 rounded-full bg-muted" aria-hidden />
                <span className="flex-1">
                  <span className="text-ink-2">{n.text}</span> <span className="text-[14px] whitespace-nowrap text-muted">{pathOf(n.sourceUrl)}</span>
                </span>
                {onRemoveCompanyNote && (
                  <button
                    onClick={() => onRemoveCompanyNote(i)}
                    className="grid size-6 shrink-0 place-items-center rounded text-muted opacity-0 group-hover:opacity-100 hover:bg-hover hover:text-ink focus-visible:opacity-100"
                    aria-label="Leave this note out"
                  >
                    <X className="size-4" strokeWidth={1.75} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">None.</p>
        )}
      </Section>
      {footer && <div className="mt-auto px-5 py-4 text-[14px] text-muted">{footer}</div>}
    </aside>
  );
}
