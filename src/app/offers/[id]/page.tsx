import type { Metadata } from "next";
import { Suspense } from "react";
import { OfferEditor } from "./offer-editor";

export const metadata: Metadata = { title: "Offer" };

export default function OfferPage() {
  return (
    <Suspense>
      <OfferEditor />
    </Suspense>
  );
}
