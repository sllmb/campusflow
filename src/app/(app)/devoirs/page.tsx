import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Devoirs" };

export default function Page() {
  return (
    <>
      <PageHeader title="Devoirs" description="Devoirs, projets et examens à venir." />
      <EmptyState
        icon={ClipboardList}
        title="Rien à rendre"
        description="Tes devoirs, projets et examens apparaîtront ici, triés par échéance."
      />
    </>
  );
}
