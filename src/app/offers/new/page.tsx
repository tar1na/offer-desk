import type { Metadata } from "next";
import { Suspense } from "react";
import { Wizard } from "./wizard";

export const metadata: Metadata = { title: "New offer" };

export default function NewOfferPage() {
  return (
    <Suspense>
      <Wizard />
    </Suspense>
  );
}
