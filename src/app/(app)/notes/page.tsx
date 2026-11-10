import type { Metadata } from "next";
import { BookOpen, GraduationCap } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, type CardTone } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { UnitGradesCard } from "@/features/grades/components/unit-grades-card";
import { formatAverage } from "@/features/grades/format";
import { getGradesOverview } from "@/features/grades/queries";
import { formatNumber } from "@/lib/format";
import { utcToLocalInput } from "@/lib/time";
import { getTimeZone } from "@/lib/timezone";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notes" };

async function GradesContent({ searchParams }: PageProps<"/notes">) {
  const { semestre } = await searchParams;
  await connection();
  const today = utcToLocalInput(new Date().toISOString(), await getTimeZone()).slice(0, 10);
  const { semesters, semester, units, result } = await getGradesOverview(
    typeof semestre === "string" ? semestre : undefined,
    today,
  );

  if (!semester) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Crée d'abord ton semestre"
        description="Les notes se saisissent par matière : commence par ton semestre, ses UE et ses matières."
        action={<ButtonLink href="/matieres">Aller aux matières</ButtonLink>}
      />
    );
  }

  const hasSubjects = units.some((unit) => unit.subjects.length > 0);
  const tone: CardTone =
    result.status === "validated" ? "green" : result.status === "failed" ? "pink" : "white";
  const statusLabel =
    result.status === "validated"
      ? "Semestre validé"
      : result.status === "failed"
        ? "Semestre non validé"
        : "Pas encore de note";

  return (
    <>
      {semesters.length > 1 && (
        <nav aria-label="Choisir le semestre" className="mb-5 flex flex-wrap gap-1.5">
          {semesters.map((item) => {
            const selected = item.id === semester.id;
            return (
              <Link
                key={item.id}
                href={`/notes?semestre=${item.id}`}
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border-2 px-3.5 text-sm font-bold",
                  selected ? "bg-ink text-background" : "bg-surface hover:bg-muted",
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      )}

      <Card tone={tone} className="mb-6 flex flex-wrap items-end justify-between gap-4 p-6">
        <div>
          <p className="text-sm font-bold">Moyenne · {semester.name}</p>
          <p className="mt-1 text-[56px] leading-none font-extrabold tracking-[-0.05em] tabular-nums">
            {formatAverage(result.average)}
            {result.average !== null && <span className="text-xl tracking-normal">/20</span>}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone={result.status === "none" ? "white" : "dark"}>{statusLabel}</Badge>
            {result.status !== "none" && !result.complete && <Badge>Provisoire</Badge>}
          </div>
        </div>
        <div className="sm:text-right">
          <p className="text-sm font-bold">Crédits acquis</p>
          <p className="text-3xl font-extrabold tracking-tight tabular-nums">
            {formatNumber(result.creditsEarned)}
            <span className="text-lg"> / {formatNumber(result.creditsTotal)} ECTS</span>
          </p>
        </div>
      </Card>

      {!hasSubjects ? (
        <EmptyState
          icon={GraduationCap}
          title="Aucune matière dans ce semestre"
          description="Ajoute tes UE et leurs matières pour saisir tes notes."
          action={<ButtonLink href={`/matieres/${semester.id}`}>Ajouter des matières</ButtonLink>}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {units.map((unit) => (
            <UnitGradesCard
              key={unit.id}
              unit={unit}
              result={result.units.find((r) => r.id === unit.id)!}
            />
          ))}
        </div>
      )}

      <p className="mt-8 text-[13px] text-ink-soft">
        Une UE est validée à 10/20 de moyenne (les matières se compensent), ou par décision du jury.
        Le semestre est validé à 10/20 de moyenne pondérée par les crédits ECTS ; il donne alors
        tous ses crédits. Résultats « provisoires » tant qu&apos;une matière n&apos;a pas de note.
      </p>
    </>
  );
}

function GradesSkeleton() {
  return (
    <div className="grid gap-5">
      <div className="h-40 animate-pulse rounded-card bg-muted" />
      <div className="h-64 animate-pulse rounded-card border-2 border-dashed bg-surface" />
    </div>
  );
}

export default function GradesPage(props: PageProps<"/notes">) {
  return (
    <>
      <PageHeader title="Notes" description="Tes notes, tes moyennes et tes crédits ECTS." />
      <Suspense fallback={<GradesSkeleton />}>
        <GradesContent {...props} />
      </Suspense>
    </>
  );
}
