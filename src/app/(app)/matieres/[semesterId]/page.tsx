import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SemesterHeader } from "@/features/subjects/components/semester-header";
import { UnitCard } from "@/features/subjects/components/unit-card";
import { nextSubjectColor } from "@/features/subjects/colors";
import { NewUnitPanel } from "@/features/subjects/components/new-unit-panel";
import { getSemester } from "@/features/subjects/queries";

export const metadata: Metadata = { title: "Semestre" };

async function SemesterContent({ params }: PageProps<"/matieres/[semesterId]">) {
  const { semesterId } = await params;
  const data = await getSemester(semesterId);
  if (!data) notFound();

  const { semester, units } = data;
  const totalCredits = units.reduce((sum, unit) => sum + unit.ects_credits, 0);
  const suggestedColor = nextSubjectColor(
    units.flatMap((unit) => unit.subjects.map((subject) => subject.color)),
  );

  return (
    <>
      <SemesterHeader semester={semester} totalCredits={totalCredits} unitCount={units.length} />
      <div className="grid gap-5 lg:grid-cols-2">
        {units.map((unit) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            semesterId={semester.id}
            suggestedColor={suggestedColor}
          />
        ))}
        <NewUnitPanel semesterId={semester.id} first={units.length === 0} />
      </div>
    </>
  );
}

function SemesterSkeleton() {
  return (
    <div className="grid gap-5">
      <div className="h-24 w-2/3 animate-pulse rounded-3xl bg-muted" />
      <div className="h-56 animate-pulse rounded-card border-2 border-dashed bg-surface" />
    </div>
  );
}

export default function SemesterPage(props: PageProps<"/matieres/[semesterId]">) {
  return (
    <Suspense fallback={<SemesterSkeleton />}>
      <SemesterContent {...props} />
    </Suspense>
  );
}
