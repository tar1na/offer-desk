"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Check, ChevronRight, CircleAlert, Copy, Download, ExternalLink, FileDown, Handshake, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { countToConfirm, Markdown } from "@/components/markdown";
import { notifyDataChanged } from "@/components/sidebar";
import { SourcesPanel } from "@/components/sources-panel";
import { Button, buttonClass, ErrorBanner, Pill, Sheet, Skeleton } from "@/components/ui";
import { api, formatDate, formatRelative } from "@/lib/client";
import type { Offer } from "@/lib/types";

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "offer";
}

export function OfferEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [dealUrl, setDealUrl] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dirty = !!offer && body !== offer.body;
  const openDetails = countToConfirm(body);

  useEffect(() => {
    api<{ offer: Offer; dealUrl: string | null }>(`/api/offers/${id}`)
      .then((r) => {
        setOffer(r.offer);
        setBody(r.offer.body);
        setDealUrl(r.dealUrl);
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  const save = useCallback(async () => {
    if (!offer || body === offer.body) return offer;
    setSaving(true);
    try {
      const title = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
      const r = await api<{ offer: Offer }>(`/api/offers/${offer.id}`, { method: "PATCH", body: JSON.stringify({ body, title }) });
      setOffer(r.offer);
      return r.offer;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setSaving(false);
    }
  }, [offer, body]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
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

  async function copy() {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function downloadMarkdown() {
    const url = URL.createObjectURL(new Blob([body], { type: "text/markdown" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `${slug(offer?.title ?? "offer")}.md` });
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadPdf() {
    if (dirty && !(await save())) return;
    Object.assign(document.createElement("a"), { href: `/api/offers/${id}/pdf`, download: "" }).click();
  }

  async function convert() {
    setConverting(true);
    setConvertError(null);
    try {
      if (dirty && !(await save())) throw new Error("Couldn't save your edits, so nothing was sent to Pipedrive.");
      const r = await api<{ offer: Offer; dealUrl: string | null }>(`/api/offers/${id}/convert`, { method: "POST" });
      setOffer(r.offer);
      setDealUrl(r.dealUrl);
      setConfirming(false);
      notifyDataChanged();
    } catch (e) {
      setConvertError((e as Error).message);
    } finally {
      setConverting(false);
    }
  }

  async function remove() {
    if (!offer) return;
    await api(`/api/offers/${offer.id}`, { method: "DELETE" });
    notifyDataChanged();
    router.push("/offers");
  }

  if (error && !offer) {
    return (
      <div className="p-8">
        <ErrorBanner message={error} />
      </div>
    );
  }

  const converted = offer?.status === "converted";

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line px-4 text-[16px] md:px-8">
        <Link href="/offers" className="text-muted hover:text-ink">
          Offers
        </Link>
        <ChevronRight className="size-4 text-muted" strokeWidth={1.75} aria-hidden />
        <h1 className="min-w-0 truncate font-semibold">{offer ? (offer.organizationName ?? offer.leadTitle) : "…"}</h1>
        {offer && (
          <Pill tone={converted ? "converted" : "draft"}>{converted ? `Deal created ${formatDate(offer.convertedAt)}` : "Draft"}</Pill>
        )}
        <div className="flex-1" />
        {offer && (
          <span className="hidden text-[15px] whitespace-nowrap text-muted sm:inline" aria-live="polite">
            {saving ? "Saving…" : dirty ? "Unsaved changes" : `Saved ${formatRelative(offer.updatedAt)}`}
          </span>
        )}
        {dirty && (
          <Button size="sm" variant="secondary" onClick={save} loading={saving}>
            Save
          </Button>
        )}
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto] lg:grid-cols-[1fr_360px] lg:grid-rows-1">
        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="flex h-12 shrink-0 items-center gap-1 border-b border-line px-4 md:gap-2 md:px-8">
            <div className="flex rounded-lg bg-subtle p-0.5" role="tablist" aria-label="View">
              {(["preview", "edit"] as const).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={`h-8 rounded-md px-3 text-[15px] font-medium whitespace-nowrap transition-colors duration-150 md:px-3.5 ${
                    mode === m ? "bg-white text-ink shadow-[0_1px_2px_rgba(17,24,39,0.08)]" : "text-muted hover:text-ink"
                  }`}
                >
                  {m === "preview" ? "Preview" : <>Edit<span className="hidden md:inline"> markdown</span></>}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <Button size="sm" variant="ghost" onClick={copy} disabled={!offer}>
              {copied ? <Check className="size-4 text-green-ink" strokeWidth={2.25} aria-hidden /> : <Copy className="size-4" strokeWidth={1.75} aria-hidden />}
              <span className="hidden md:inline">{copied ? "Copied" : "Copy"}</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={downloadMarkdown} disabled={!offer}>
              <Download className="size-4" strokeWidth={1.75} aria-hidden />
              <span className="hidden md:inline">Markdown</span>
              <span className="sr-only md:hidden">Download markdown</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={downloadPdf} disabled={!offer}>
              <FileDown className="size-4" strokeWidth={1.75} aria-hidden />
              <span className="hidden md:inline">PDF</span>
              <span className="sr-only md:hidden">Download PDF</span>
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {!offer ? (
              <div className="flex max-w-[640px] flex-col gap-3 px-8 py-8">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
              </div>
            ) : mode === "preview" ? (
              <div className="px-4 py-6 md:px-8 md:py-8">
                <Markdown>{body}</Markdown>
              </div>
            ) : (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                aria-label="Offer markdown"
                spellCheck
                className="block h-full w-full resize-none bg-white px-4 py-6 font-mono md:px-8 md:py-8 text-[15px] leading-[1.7] text-ink focus:outline-none"
              />
            )}
          </div>
          <div className="flex h-[72px] shrink-0 items-center gap-3 border-t border-line px-4 md:px-8">
            {converted ? (
              <>
                <p className="hidden flex-1 truncate text-ink-2 md:block">Deal created in Pipedrive with this offer attached.</p>
                {dealUrl && (
                  <a href={dealUrl} target="_blank" rel="noreferrer" className={buttonClass("primary")}>
                    Open deal in Pipedrive
                    <ExternalLink className="size-[18px]" strokeWidth={1.75} aria-hidden />
                  </a>
                )}
              </>
            ) : (
              <>
                <p className="hidden min-w-0 flex-1 truncate text-[15px] md:block">
                  {openDetails ? (
                    <span className="text-amber-ink">
                      {openDetails} {openDetails === 1 ? "detail is" : "details are"} still marked to confirm.
                    </span>
                  ) : (
                    <span className="text-muted">Ready to convert into a deal.</span>
                  )}
                </p>
                <div className="flex-1 md:hidden" />
                <Button variant="primary" onClick={() => setConfirming(true)} disabled={!offer}>
                  <Handshake className="size-[18px]" strokeWidth={1.75} aria-hidden />
                  Convert to deal
                </Button>
              </>
            )}
          </div>
        </div>
        {offer && (
          <SourcesPanel
            templateName={offer.sources.template.name}
            notes={offer.sources.notes}
            website={offer.sources.website}
            pages={offer.sources.pages}
            companyNotes={offer.sources.companyNotes}
            footer={
              <div className="flex items-center justify-between gap-3">
                <span>
                  Written {formatDate(offer.createdAt)} with {offer.sources.model}
                </span>
                {!converted &&
                  (confirmDelete ? (
                    <span className="flex items-center gap-1">
                      <button onClick={() => setConfirmDelete(false)} className="rounded px-1.5 py-1 text-ink-2 hover:bg-hover">
                        Keep
                      </button>
                      <button onClick={remove} className="rounded px-1.5 py-1 font-medium text-red-ink hover:bg-red-soft">
                        Delete draft
                      </button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 rounded px-1.5 py-1 text-muted hover:bg-red-soft hover:text-red-ink">
                      <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
                      Delete
                    </button>
                  ))}
              </div>
            }
          />
        )}
      </div>

      <Sheet
        open={confirming}
        title="Convert to a deal"
        onClose={() => !converting && setConfirming(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(false)} disabled={converting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={convert} loading={converting}>
              {converting ? "Creating deal" : "Create deal in Pipedrive"}
            </Button>
          </>
        }
      >
        <p className="text-ink-2">
          <strong className="font-semibold text-ink">{offer?.leadTitle}</strong> becomes a deal in Pipedrive. The lead is closed there, and the deal keeps its organization, contact and value.
        </p>
        <ul className="mt-5 flex flex-col gap-3">
          {["The offer is added to the deal as a note.", "A PDF of the offer is attached to the deal as a file.", "This offer is marked as converted here."].map((t) => (
            <li key={t} className="flex items-start gap-3">
              <Check className="mt-0.5 size-[18px] shrink-0 text-muted" strokeWidth={2.25} aria-hidden />
              {t}
            </li>
          ))}
        </ul>
        {openDetails > 0 && (
          <p className="mt-5 flex items-start gap-2 rounded-lg bg-amber-soft px-3 py-2.5 text-amber-ink">
            <CircleAlert className="mt-0.5 size-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
            {openDetails} {openDetails === 1 ? "detail is" : "details are"} still marked “to confirm”. They will be sent to Pipedrive as they are unless you edit them first.
          </p>
        )}
        {dirty && <p className="mt-5 text-amber-ink">Your unsaved edits are saved first.</p>}
        {convertError && (
          <div className="mt-5">
            <ErrorBanner message={convertError} />
          </div>
        )}
      </Sheet>
    </div>
  );
}
