"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const TO_CONFIRM = /\[to confirm:[^\]]*\]/gi;

export function countToConfirm(markdown: string): number {
  return markdown.match(TO_CONFIRM)?.length ?? 0;
}

type MdNode = { type: string; value?: string; children?: MdNode[]; data?: Record<string, unknown> };

/** Turns "[to confirm: …]" text into <mark> elements so open details stand out in the preview. */
function remarkToConfirm() {
  const split = (node: MdNode) => {
    if (!node.children) return;
    node.children = node.children.flatMap((child) => {
      if (child.type !== "text" || !child.value) {
        split(child);
        return [child];
      }
      const parts: MdNode[] = [];
      let last = 0;
      for (const m of child.value.matchAll(TO_CONFIRM)) {
        if (m.index! > last) parts.push({ type: "text", value: child.value.slice(last, m.index) });
        parts.push({
          type: "toConfirm",
          data: { hName: "mark", hProperties: { className: ["to-confirm"] } },
          children: [{ type: "text", value: m[0] }],
        });
        last = m.index! + m[0].length;
      }
      if (!parts.length) return [child];
      if (last < child.value.length) parts.push({ type: "text", value: child.value.slice(last) });
      return parts;
    });
  };
  return (tree: MdNode) => split(tree);
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-offer">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkToConfirm]}>{children}</ReactMarkdown>
    </div>
  );
}
