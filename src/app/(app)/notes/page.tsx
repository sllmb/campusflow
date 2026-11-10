import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Notes" };

export default function Page() {
  return (
    <>
      <PageHeader title="Notes" description="Vos notes et moyennes, calculées automatiquement." />
      <EmptyState
        icon={GraduationCap}
        title="Aucune note enregistrée"
        description="Saisissez vos notes : les moyennes par matière et la moyenne générale se calculent toutes seules."
      />
    </>
  );
}
