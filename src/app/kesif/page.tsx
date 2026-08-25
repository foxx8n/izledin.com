import type { Metadata } from "next";
import { KesifView } from "@/components/kesif/KesifView";

/**
 * KEŞİF — catalog showcase (S4 / Push A, MATCHING-PIVOT-PLAN.md).
 * Purely additive: receives the masterpiece hero + Vizyondakiler explorer so
 * the S7 atomic flip can turn `/` into the PERDE deck with zero content loss.
 * Server wrapper owns metadata; the view is a client component (catalog
 * ranking/filters are client-side per existing architecture).
 */
export const metadata: Metadata = {
  title: "Keşif — Vizyondakiler & Kült Katalog | İzledin",
  description:
    "Haftanın başyapıtı ve kulübün puanladığı 2000+ film, dizi ve anime. CineScore önerileri, tür filtreleri ve izleme listesi ile keşfet.",
  alternates: { canonical: "/kesif" },
};

export default function KesifPage() {
  return <KesifView />;
}
