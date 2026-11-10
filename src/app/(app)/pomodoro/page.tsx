import type { Metadata } from "next";
import { Timer } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Pomodoro" };

export default function Page() {
  return (
    <>
      <PageHeader title="Pomodoro" description="Travaille par sessions de 25 minutes." />
      <EmptyState
        icon={Timer}
        title="Minuteur à venir"
        description="Lance une session de travail et rattache-la à une matière."
      />
    </>
  );
}
