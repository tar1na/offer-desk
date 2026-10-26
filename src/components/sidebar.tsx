"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutTemplate, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Status = {
  pipedrive: { connected: boolean; companyName?: string; companyDomain?: string; error?: string };
  counts: { leads: number | null; offers: number; templates: number };
};

export const DATA_CHANGED = "offerdesk:changed";

export function notifyDataChanged() {
  window.dispatchEvent(new Event(DATA_CHANGED));
}

const NAV = [
  { href: "/leads", label: "Leads", icon: Users, count: "leads" },
  { href: "/offers", label: "Offers", icon: FileText, count: "offers" },
  { href: "/templates", label: "Templates", icon: LayoutTemplate, count: "templates" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const [status, setStatus] = useState<Status | null>(null);

  const load = useCallback(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(DATA_CHANGED, load);
    return () => window.removeEventListener(DATA_CHANGED, load);
  }, [load]);

  return (
    <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col border-r border-line bg-sidebar lg:w-[240px]">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="grid size-7 place-items-center rounded-lg bg-ink text-[14px] font-semibold text-white">O</span>
        <span className="hidden text-[16px] font-semibold tracking-[-0.01em] lg:inline">Offer Desk</span>
      </div>
      <nav className="flex flex-col gap-0.5 px-2 pt-2 lg:px-3" aria-label="Main">
        {NAV.map(({ href, label, icon: Icon, count }) => {
          const active = pathname.startsWith(href);
          const n = status?.counts[count];
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              title={label}
              className={`flex h-10 items-center justify-center gap-3 rounded-lg px-3 lg:justify-start text-[16px] transition-colors duration-150 ${
                active ? "bg-white font-medium text-ink shadow-[0_1px_2px_rgba(17,24,39,0.06),0_0_0_1px_var(--line)]" : "text-ink-2 hover:bg-hover"
              }`}
            >
              <Icon className={`size-[18px] ${active ? "text-accent" : "text-muted"}`} strokeWidth={1.75} aria-hidden />
              <span className="sr-only flex-1 lg:not-sr-only">{label}</span>
              {n != null && <span className="tabular hidden text-[14px] text-muted lg:inline">{n}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto hidden border-t border-line px-5 py-4 lg:block">
        {status ? (
          <div className="flex items-start gap-2.5">
            <span
              className={`mt-[7px] size-2 shrink-0 rounded-full ${status.pipedrive.connected ? "bg-[#22a05a]" : "bg-[#d92d20]"}`}
              aria-hidden
            />
            <div className="min-w-0 text-[14px] leading-snug">
              <p className="font-medium text-ink-2">{status.pipedrive.connected ? "Pipedrive connected" : "Pipedrive not connected"}</p>
              <p className="truncate text-muted">
                {status.pipedrive.connected ? `${status.pipedrive.companyDomain}.pipedrive.com` : status.pipedrive.error}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-[14px] text-muted">Checking Pipedrive…</p>
        )}
      </div>
    </aside>
  );
}
