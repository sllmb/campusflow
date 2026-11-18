import type { Metadata } from "next";
import { ChevronRight, FileText } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { AdminGate } from "@/features/admin/components/admin-gate";
import { NewFormPanel } from "@/features/forms/components/admin-forms";
import { FORM_STATUSES } from "@/features/forms/lib/forms";
import { listFormsWithCounts } from "@/features/forms/queries";
import { plural } from "@/lib/format";

export const metadata: Metadata = { title: "Formulaires", robots: { index: false } };

async function FormsList() {
  const forms = await listFormsWithCounts();
  return (
    <div className="grid gap-4">
      <NewFormPanel />
      {forms.length === 0 ? (
        <p className="text-[15px] text-ink-soft">
          Aucun formulaire pour l&apos;instant. Crée le premier pour mieux connaître tes
          utilisateurs.
        </p>
      ) : (
        <ul className="grid gap-3">
          {forms.map((form) => {
            const status = FORM_STATUSES[form.status];
            return (
              <li key={form.id}>
                <Link
                  href={`/admin/formulaires/${form.id}`}
                  className="flex items-center gap-3 rounded-3xl border-2 bg-surface p-4 hover:shadow-hard-sm"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-extrabold">{form.title}</span>
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      <Badge tone={status.tone}>{status.label}</Badge>
                      <Badge>{form.anonymous ? "Anonyme" : "Nominatif"}</Badge>
                      <Badge>{plural(form.responses, "réponse")}</Badge>
                    </span>
                  </span>
                  <ChevronRight className="size-5 shrink-0" strokeWidth={2.4} aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function FormsPage() {
  return (
    <Suspense fallback={<div className="h-48 animate-pulse rounded-card bg-muted" />}>
      <AdminGate>
        <PageHeader
          eyebrow="Réservé à l'éditeur"
          title={
            <span className="flex items-center gap-3">
              <FileText className="size-9" strokeWidth={2.4} aria-hidden /> Formulaires
            </span>
          }
          description="Des questionnaires pour mieux connaître tes utilisateurs."
        />
        <FormsList />
      </AdminGate>
    </Suspense>
  );
}
