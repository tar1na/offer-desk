"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

export type Sort<K extends string> = { key: K; dir: "asc" | "desc" };

export function SortHeader<K extends string>({
  label,
  k,
  sort,
  onSort,
  align = "left",
  className = "",
}: {
  label: string;
  k: K;
  sort: Sort<K>;
  onSort: (s: Sort<K>) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const active = sort.key === k;
  const Icon = sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      className={`h-11 border-b border-line px-3 text-[14px] font-medium text-muted first:pl-8 last:pr-8 ${className}`}
    >
      <button
        onClick={() => onSort({ key: k, dir: active && sort.dir === "asc" ? "desc" : "asc" })}
        className={`inline-flex items-center gap-1 rounded hover:text-ink ${align === "right" ? "flex-row-reverse" : ""} ${active ? "text-ink" : ""}`}
      >
        {label}
        <Icon className={`size-3.5 ${active ? "opacity-100" : "opacity-0"}`} strokeWidth={2} aria-hidden />
      </button>
    </th>
  );
}

export function compare(a: unknown, b: unknown): number {
  if (a == null || a === "") return 1;
  if (b == null || b === "") return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "en", { sensitivity: "base" });
}
