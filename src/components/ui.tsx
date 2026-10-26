"use client";

import Link from "next/link";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { useEffect, type ComponentProps, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "md" | "sm";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover border border-accent hover:border-accent-hover shadow-[0_1px_2px_rgba(17,24,39,0.12)]",
  secondary: "bg-white text-ink border border-line-strong hover:bg-hover shadow-[0_1px_2px_rgba(17,24,39,0.05)]",
  ghost: "bg-transparent text-ink-2 border border-transparent hover:bg-hover",
  danger: "bg-white text-red-ink border border-line-strong hover:bg-red-soft",
};
const sizes: Record<ButtonSize, string> = {
  md: "h-10 px-4 text-[15px] gap-2",
  sm: "h-8 px-3 text-[14px] gap-1.5",
};

export function buttonClass(variant: ButtonVariant = "secondary", size: ButtonSize = "md", extra = "") {
  return `inline-flex items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function Button({
  variant = "secondary",
  size = "md",
  loading,
  className = "",
  children,
  disabled,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean }) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden />}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "secondary",
  size = "md",
  className = "",
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

export function PageHeader({ title, count, actions, children }: { title: ReactNode; count?: number; actions?: ReactNode; children?: ReactNode }) {
  return (
    <header className="flex min-h-16 items-center gap-4 border-b border-line px-8 py-3">
      <div className="min-w-0 flex-1">
        <h1 className="flex items-baseline gap-2.5 truncate text-[22px] font-semibold tracking-[-0.015em]">
          {title}
          {count !== undefined && <span className="tabular text-[16px] font-normal text-muted">{count}</span>}
        </h1>
        {children}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

const pillTones = {
  neutral: "bg-subtle text-ink-2",
  draft: "bg-amber-soft text-amber-ink",
  converted: "bg-green-soft text-green-ink",
  accent: "bg-accent-soft text-accent-ink",
  error: "bg-red-soft text-red-ink",
};

export function Pill({ tone = "neutral", children }: { tone?: keyof typeof pillTones; children: ReactNode }) {
  return (
    <span className={`inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-[14px] font-medium whitespace-nowrap ${pillTones[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: ReactNode; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
      <div className="mb-4 grid size-11 place-items-center rounded-lg border border-line bg-white text-muted shadow-[0_1px_2px_rgba(17,24,39,0.05)]">
        {icon}
      </div>
      <h2 className="text-[18px] font-semibold">{title}</h2>
      <p className="mt-1.5 text-muted">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-lg border border-[#f5c2bd] bg-red-soft px-4 py-3 text-red-ink">
      <AlertTriangle className="mt-0.5 size-[18px] shrink-0" strokeWidth={2} aria-hidden />
      <p className="flex-1">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="font-medium underline">
          Try again
        </button>
      )}
    </div>
  );
}

export function Sheet({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-[rgba(17,24,39,0.18)] [animation:fade-in_160ms_ease-out]" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-y-0 right-0 flex w-[460px] max-w-full flex-col border-l border-line bg-white shadow-[0_12px_40px_rgba(17,24,39,0.14)] [animation:sheet-in_200ms_var(--ease-out-expo)]"
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-6">
          <h2 className="text-[18px] font-semibold">{title}</h2>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-hover" aria-label="Close">
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
      </aside>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[15px] font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[14px] text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-[16px] text-ink placeholder:text-[#8a8f99] shadow-[0_1px_2px_rgba(17,24,39,0.04)] transition-[border-color,box-shadow] duration-150 focus:border-accent focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)] focus:outline-none";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-subtle ${className}`} />;
}

export function Spinner({ className = "size-4" }: { className?: string }) {
  return <Loader2 className={`${className} animate-spin text-accent`} strokeWidth={2} aria-hidden />;
}
