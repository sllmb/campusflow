import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Matières" };

export default function Page() {
  return (
    <>
      <PageHeader title="Matières" description="Vos matières, leur couleur et leur coefficient." />
      <EmptyState
        icon={BookOpen}
        title="Aucune matière pour l'instant"
        description="Ajoutez vos matières pour y rattacher devoirs, examens et notes."
      />
    </>
  );
}
