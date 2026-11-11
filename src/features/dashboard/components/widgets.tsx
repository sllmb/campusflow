import { ArrowRight, CalendarClock, ChartColumn, Timer } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardLabel, CardTitle, CardValue } from "@/components/ui/card";
import { kindInfo } from "@/features/assignments/constants";
import type { AssignmentView } from "@/features/assignments/lib/schedule";
import { formatAverage } from "@/features/grades/format";
import type { SemesterResult } from "@/features/grades/lib/average";
import type { UnitWithGrades } from "@/features/grades/queries";
import { subjectColorClass } from "@/features/subjects/colors";
import {
  RevisionSlotRow,
  type RevisionSlotView,
} from "@/features/revisions/components/revision-slot-row";
import { formatMinutes } from "@/features/focus/lib/timer";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

const widgetLink =
  "block rounded-card transition-transform hover:-translate-x-px hover:-translate-y-px focus-visible:outline-offset-4";

/** Grande carte bleue : la prochaine échéance à rendre (ou la plus en retard). */
export function NextDueWidget({ item }: { item: AssignmentView | undefined }) {
  if (!item) {
    return (
      <Link href="/devoirs?ajouter=1" className={cn(widgetLink, "col-span-2")}>
        <Card tone="blue" className="h-full">
          <Badge>Prochain rendu</Badge>
          <p className="mt-5 text-[28px] leading-[1.05] font-extrabold tracking-[-0.03em] lg:text-[34px]">
            Rien à rendre pour l&apos;instant
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold">
            Ajouter un devoir <ArrowRight className="size-4" strokeWidth={2.6} aria-hidden />
          </p>
        </Card>
      </Link>
    );
  }

  const kind = kindInfo(item.kind);
  return (
    <Link href="/devoirs" className={cn(widgetLink, "col-span-2")}>
      <Card tone={item.overdue ? "pink" : "blue"} className="h-full">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge>{item.subject.name}</Badge>
          <Badge tone="dark">{item.dueLabel}</Badge>
        </div>
        <p className="mt-4 text-sm font-bold">
          {item.overdue ? "En retard" : "Prochain rendu"} · {kind.label}
        </p>
        <p className="text-[28px] leading-[1.05] font-extrabold tracking-[-0.03em] lg:text-[34px]">
          {item.title}
        </p>
        {item.notes && <p className="mt-2 line-clamp-2 text-sm font-semibold">{item.notes}</p>}
      </Card>
    </Link>
  );
}

/** Carré jaune : moyenne du semestre en cours. */
export function AverageWidget({ result }: { result: SemesterResult }) {
  const caption =
    result.status === "none"
      ? "Aucune note"
      : `${result.status === "validated" ? "Validé" : "Non validé"}${result.complete ? "" : " · provisoire"}`;
  return (
    <Link href="/notes" className={widgetLink}>
      <Card
        tone="yellow"
        className="flex aspect-square h-full flex-col justify-between p-4 lg:aspect-auto lg:p-5"
      >
        <CardLabel>Moyenne</CardLabel>
        <div>
          <CardValue className="tabular-nums">{formatAverage(result.average)}</CardValue>
          <p className="mt-1 text-[13px] font-semibold">{caption}</p>
        </div>
      </Card>
    </Link>
  );
}

/** Carré vert : temps de concentration du jour. */
export function FocusWidget({
  totalSeconds,
  sessions,
}: {
  totalSeconds: number;
  sessions: number;
}) {
  return (
    <Link href="/pomodoro" className={widgetLink}>
      <Card
        tone="green"
        className="flex aspect-square h-full flex-col justify-between p-4 lg:aspect-auto lg:p-5"
      >
        <div className="flex items-start justify-between">
          <CardLabel>Pomodoro</CardLabel>
          <span className="flex size-10 items-center justify-center rounded-full border-2 bg-ink text-green">
            <Timer className="size-5" strokeWidth={2.4} aria-hidden />
          </span>
        </div>
        <div>
          <CardValue className="tabular-nums">{formatDuration(totalSeconds)}</CardValue>
          <p className="mt-1 text-[13px] font-semibold">
            {sessions > 0
              ? `aujourd'hui · ${sessions} session${sessions > 1 ? "s" : ""}`
              : "aujourd'hui"}
          </p>
        </div>
      </Card>
    </Link>
  );
}

/** Les prochaines échéances, retards d'abord. */
export function UpcomingWidget({
  items,
  dueThisWeek,
  overdue,
}: {
  items: AssignmentView[];
  dueThisWeek: number;
  overdue: number;
}) {
  return (
    <Card className="col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>À venir</CardTitle>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="blue">{dueThisWeek} cette semaine</Badge>
          {overdue > 0 && <Badge tone="pink">{overdue} en retard</Badge>}
        </div>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-[15px] text-ink-soft">Aucune échéance en attente.</p>
      ) : (
        <ul className="mt-3 divide-y-2 divide-dashed divide-ink/15">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-2.5">
              <span
                aria-hidden
                className={cn(
                  "h-9 w-2 shrink-0 rounded-full border-2",
                  subjectColorClass(item.subject.color),
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold">{item.title}</p>
                <p className="truncate text-[13px] text-ink-soft">
                  {item.subject.name} · {kindInfo(item.kind).label}
                </p>
              </div>
              <Badge tone={item.overdue ? "pink" : "white"} className="shrink-0">
                {item.dueLabel}
              </Badge>
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/devoirs"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold underline-offset-4 hover:underline"
      >
        Tout voir <ArrowRight className="size-4" strokeWidth={2.6} aria-hidden />
      </Link>
    </Card>
  );
}

/** Matières du semestre en cours, avec leur moyenne. */
export function SubjectsWidget({
  semesterName,
  units,
  result,
}: {
  semesterName: string | null;
  units: UnitWithGrades[];
  result: SemesterResult;
}) {
  const subjects = units.flatMap((unit) =>
    unit.subjects.map((subject) => ({
      ...subject,
      unitCode: unit.code,
      average:
        result.units.find((r) => r.id === unit.id)?.subjects.find((s) => s.id === subject.id)
          ?.average ?? null,
    })),
  );

  return (
    <Card className="col-span-2">
      <div className="flex items-center justify-between gap-2">
        <CardTitle>Mes matières</CardTitle>
        {semesterName && <Badge>{semesterName}</Badge>}
      </div>
      {subjects.length === 0 ? (
        <p className="mt-3 text-[15px] text-ink-soft">
          Aucune matière pour l&apos;instant.{" "}
          <Link href="/matieres" className="font-bold underline underline-offset-4">
            Ajouter mes matières
          </Link>
        </p>
      ) : (
        <ul className="mt-3 grid gap-2.5">
          {subjects.map((subject) => (
            <li key={subject.id} className="flex items-center gap-3">
              <span
                aria-hidden
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-extrabold",
                  subjectColorClass(subject.color),
                )}
              >
                {subject.name.trim().charAt(0).toUpperCase()}
              </span>
              <p className="min-w-0 flex-1 truncate text-[15px] font-bold">
                {subject.name}
                {subject.unitCode && (
                  <span className="ml-1.5 text-[13px] font-semibold text-ink-soft">
                    {subject.unitCode}
                  </span>
                )}
              </p>
              <span
                className={cn(
                  "text-lg font-extrabold tabular-nums",
                  subject.average !== null && subject.average < 10 && "text-error",
                )}
              >
                {formatAverage(subject.average)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/notes"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold underline-offset-4 hover:underline"
      >
        Voir mes notes <ArrowRight className="size-4" strokeWidth={2.6} aria-hidden />
      </Link>
    </Card>
  );
}

/** Lien vers les statistiques (sur téléphone, elles ne sont pas dans la barre du bas). */
export function StatsLinkWidget() {
  return (
    <Link href="/statistiques" className={cn(widgetLink, "col-span-2 lg:col-span-4")}>
      <Card className="flex items-center gap-4 p-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border-2 bg-orange">
          <ChartColumn className="size-5" strokeWidth={2.4} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-extrabold">Mes statistiques</span>
          <span className="block truncate text-[13px] text-ink-soft">
            Temps de travail, régularité, évolution de la moyenne
          </span>
        </span>
        <ArrowRight className="size-5 shrink-0" strokeWidth={2.6} aria-hidden />
      </Card>
    </Link>
  );
}

/** Les créneaux de révision du jour (affiché seulement s'il y en a). */
export function TodayRevisionsWidget({
  slots,
  today,
}: {
  slots: RevisionSlotView[];
  today: string;
}) {
  if (slots.length === 0) return null;
  const left = slots.filter((slot) => !slot.done).reduce((sum, slot) => sum + slot.minutes, 0);
  return (
    <Card className="col-span-2">
      <div className="flex items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="size-5" strokeWidth={2.4} aria-hidden />
          Révisions du jour
        </CardTitle>
        <Badge tone={left ? "yellow" : "green"}>
          {left ? `${formatMinutes(left)} à faire` : "Tout est fait"}
        </Badge>
      </div>
      <ul className="mt-3 grid gap-2.5">
        {slots.map((slot) => (
          <RevisionSlotRow key={slot.id} slot={slot} today={today} context />
        ))}
      </ul>
    </Card>
  );
}
