import type { Metadata } from "next";
import { BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AddPanel } from "@/features/subjects/components/add-panel";
import { SemesterForm } from "@/features/subjects/components/semester-form";
import { listSemesters } from "@/features/subjects/queries";
import { formatDate, plural } from "@/lib/format";

export const metadata: Metadata = { title: "Matières" };

async function SemesterList() {
  const semesters = await listSemesters();

  if (semesters.length === 0) {
    return (
      <div className="grid gap-4">
        <EmptyState
          icon={BookOpen}
          title="Commence par ton semestre"
          description="Crée ton semestre, puis ajoute ses UE et leurs matières. Tout le reste (devoirs, notes) s'y rattachera."
        />
        <AddPanel label="Créer mon premier semestre" defaultOpen>
          {() => <SemesterForm />}
        </AddPanel>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <ul className="grid gap-4 sm:grid-cols-2">
        {semesters.map((semester) => (
          <li key={semester.id}>
            <Link
              href={`/matieres/${semester.id}`}
              className="flex items-center gap-4 rounded-card border-2 bg-surface p-5 shadow-hard transition-transform hover:-translate-x-px hover:-translate-y-px"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xl font-extrabold tracking-tight">{semester.name}</p>
                <p className="mt-0.5 text-[13px] text-ink-soft">
                  {formatDate(semester.starts_on)} → {formatDate(semester.ends_on)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="yellow">{plural(semester.totalCredits, "crédit")} ECTS</Badge>
                  <Badge>{plural(semester.unitCount, "UE", "UE")}</Badge>
                </div>
              </div>
              <ChevronRight className="size-6 shrink-0" strokeWidth={2.4} aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <AddPanel label="Nouveau semestre" className="sm:max-w-md">
        {(close) => <SemesterForm onDone={close} />}
      </AddPanel>
    </div>
  );
}

function ListSkeleton() {
  return <div className="h-32 animate-pulse rounded-card border-2 border-dashed bg-surface" />;
}

export default function SubjectsPage() {
  return (
    <>
      <PageHeader title="Matières" description="Tes semestres, leurs UE et leurs matières." />
      <Suspense fallback={<ListSkeleton />}>
        <SemesterList />
      </Suspense>
    </>
  );
}
