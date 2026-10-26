import type { Metadata } from "next";
import { Suspense } from "react";
import { TemplateEditor } from "./template-editor";

export const metadata: Metadata = { title: "Template" };

export default function TemplatePage() {
  return (
    <Suspense>
      <TemplateEditor />
    </Suspense>
  );
}
