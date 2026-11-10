import type { Metadata } from "next";
import { Timer } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Pomodoro" };

export default function Page() {
  return (
    <>
      <PageHeader title="Pomodoro" description="Travaillez par sessions de 25 minutes." />
      <EmptyState
        icon={Timer}
        title="Minuteur à venir"
        description="Lancez une session de travail et rattachez-la à une matière."
      />
    </>
  );
}
