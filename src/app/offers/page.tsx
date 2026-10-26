import type { Metadata } from "next";
import { OffersView } from "./offers-view";

export const metadata: Metadata = { title: "Offers" };

export default function OffersPage() {
  return <OffersView />;
}
