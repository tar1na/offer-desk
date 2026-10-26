"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Markdown } from "@/components/markdown";
import { notifyDataChanged } from "@/components/sidebar";
import { Button, ErrorBanner, inputClass, Skeleton } from "@/components/ui";
import { api, formatRelative } from "@/lib/client";
import type { Template } from "@/lib/types";

const STARTER = `# Offer for {{company}}

## Summary
One or two sentences on what {{company}} gets.

## What we heard
- [Key need from the meeting]

## Scope
- [What is included]

## Pricing
| Item | Price |
| --- | --- |
| [Item] | €0 |

## Next steps
[How to say yes]
`;

export function TemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const router = useRouter();
  const [saved, setSaved] = useState<Template | null>(null);
  const [form, setForm] = useState({ name: "", description: "", body: isNew ? STARTER : "" });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isNew) return;
    api<{ template: Template }>(`/api/templates/${id}`)
      .then((r) => {
        setSaved(r.template);
        setForm({ name: r.template.name, description: r.template.description, body: r.template.body });
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const dirty = isNew ? form.name.trim() !== "" || form.body !== STARTER : !!saved && (form.name !== saved.name || form.description !== saved.description || form.body !== saved.body);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        const r = await api<{ template: Template }>("/api/templates", { method: "POST", body: JSON.stringify(form) });
        notifyDataChanged();
        router.replace(`/templates/${r.template.id}`);
      } else {
        const r = await api<{ template: Template }>(`/api/templates/${id}`, { method: "PUT", body: JSON.stringify(form) });
        setSaved(r.template);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [form, id, isNew, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (dirty) save();
      }
    };
    const onUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [save, dirty]);

  async function remove() {
    await api(`/api/templates/${id}`, { method: "DELETE" });
    notifyDataChanged();
    router.push("/templates");
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line px-8 text-[16px]">
        <Link href="/templates" className="text-muted hover:text-ink">
          Templates
        </Link>
        <ChevronRight className="size-4 text-muted" strokeWidth={1.75} aria-hidden />
        <h1 className="min-w-0 truncate font-semibold">{isNew ? "New template" : saved?.name ?? "…"}</h1>
        <div className="flex-1" />
        {!isNew && saved && (
          <span className="text-[15px] text-muted" aria-live="polite">
            {saving ? "Saving…" : dirty ? "Unsaved changes" : `Saved ${formatRelative(saved.updatedAt)}`}
          </span>
        )}
        {!isNew &&
          (confirmDelete ? (
            <span className="flex items-center gap-2">
              <span className="text-[15px] text-ink-2">Delete this template?</span>
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                Keep
              </Button>
              <Button size="sm" variant="danger" onClick={remove}>
                Delete
              </Button>
            </span>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)} aria-label="Delete template">
              <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
              Delete
            </Button>
          ))}
        <Button variant="primary" size="sm" onClick={save} loading={saving} disabled={!dirty || !form.name.trim()}>
          {isNew ? "Create template" : "Save"}
        </Button>
      </header>
      {error && (
        <div className="px-8 pt-4">
          <ErrorBanner message={error} />
        </div>
      )}
      {loading ? (
        <div className="flex flex-col gap-3 p-8">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <div className="grid shrink-0 grid-cols-[1fr_1.4fr] gap-4 border-b border-line px-8 py-4">
            <label className="block">
              <span className="mb-1.5 block text-[15px] font-medium text-ink-2">Name</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Managed IT Support" className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[15px] font-medium text-ink-2">Description</span>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="When to use this template" className={inputClass} />
            </label>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-2">
            <div className="flex min-h-0 flex-col border-r border-line">
              <div className="flex h-11 shrink-0 items-center justify-between border-b border-line px-8 text-[14px] text-muted">
                <span className="font-medium">Markdown</span>
                <span>
                  Use <code className="rounded bg-subtle px-1 font-mono text-ink-2">{"{{company}}"}</code> and <code className="rounded bg-subtle px-1 font-mono text-ink-2">[hints]</code> for what the AI fills in
                </span>
              </div>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                aria-label="Template markdown"
                className="block min-h-0 w-full flex-1 resize-none bg-white px-8 py-6 font-mono text-[15px] leading-[1.7] text-ink focus:outline-none"
              />
            </div>
            <div className="flex min-h-0 flex-col bg-sidebar">
              <div className="flex h-11 shrink-0 items-center border-b border-line px-8 text-[14px] font-medium text-muted">Preview</div>
              <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
                <Markdown>{form.body}</Markdown>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
