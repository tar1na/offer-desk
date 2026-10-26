"use client";

import { useRouter } from "next/navigation";
import { LayoutTemplate, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { ButtonLink, EmptyState, ErrorBanner, PageHeader, Pill, Skeleton } from "@/components/ui";
import { api, formatDate } from "@/lib/client";
import type { Template } from "@/lib/types";

function sectionCount(body: string) {
  return body.split("\n").filter((l) => /^##\s+/.test(l)).length;
}

export function TemplatesView() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ templates: Template[] }>("/api/templates")
      .then((r) => setTemplates(r.templates))
      .catch((e: Error) => setError(e.message));
  }, []);

  const newButton = (
    <ButtonLink href="/templates/new" variant="primary">
      <Plus className="size-[18px]" strokeWidth={2} aria-hidden />
      New template
    </ButtonLink>
  );

  return (
    <>
      <PageHeader title="Templates" count={templates?.length} actions={newButton} />
      {error ? (
        <div className="p-8">
          <ErrorBanner message={error} />
        </div>
      ) : templates && templates.length === 0 ? (
        <EmptyState
          icon={<LayoutTemplate className="size-5" strokeWidth={1.75} />}
          title="No templates"
          body="A template is the offer you send most often, written in markdown. Offer Desk rewrites it for each company."
          action={newButton}
        />
      ) : (
        <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr>
              {["Template", "Description", "Sections", "Updated"].map((h, i) => (
                <th key={h} scope="col" className={`h-11 border-b border-line px-3 text-[14px] font-medium text-muted ${i === 0 ? "pl-8" : ""} ${i === 3 ? "pr-8" : ""} ${i === 2 ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!templates
              ? Array.from({ length: 4 }, (_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 4 }, (_, j) => (
                      <td key={j} className="h-[52px] border-b border-line px-3 first:pl-8 last:pr-8">
                        <Skeleton className="h-4 w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              : templates.map((t) => (
                  <tr key={t.id} onClick={() => router.push(`/templates/${t.id}`)} className="cursor-pointer transition-colors duration-100 hover:bg-[#fafafb]">
                    <td className="h-[52px] border-b border-line px-3 pl-8 font-medium">
                      <span className="flex items-center gap-2.5">
                        {t.name.replace(/\s*\(Sample\)$/, "")}
                        {t.isSample && <Pill>Sample</Pill>}
                      </span>
                    </td>
                    <td className="max-w-[460px] truncate border-b border-line px-3 text-ink-2">{t.description}</td>
                    <td className="tabular border-b border-line px-3 text-right text-ink-2">{sectionCount(t.body)}</td>
                    <td className="tabular border-b border-line px-3 pr-8 text-ink-2">{formatDate(t.updatedAt)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
        </div>
      )}
    </>
  );
}
