import type { Metadata } from "next";
import { CalendarCheck, Flame, Timer } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { Segmented } from "@/features/assignments/components/view-switch";
import { formatAverage } from "@/features/grades/format";
import { subjectColorClass } from "@/features/subjects/colors";
import { AverageLine, FocusBars } from "@/features/stats/components/charts";
import {
  averageTimeline,
  currentStreak,
  focusByDay,
  focusBySubject,
  lastDays,
  localDay,
  onTimeRate,
  parsePeriod,
  type Period,
} from "@/features/stats/lib/stats";
import { getStatsData, HISTORY_DAYS } from "@/features/stats/queries";
import { formatDuration } from "@/lib/format";
import { utcToLocalInput } from "@/lib/time";
import { getTimeZone } from "@/lib/timezone";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Statistiques" };

function PeriodSwitch({ period }: { period: Period }) {
  return (
    <Segmented
      label="Période"
      options={[
        { href: "/statistiques?periode=7", label: "7 jours", selected: period === 7 },
        { href: "/statistiques?periode=30", label: "30 jours", selected: period === 30 },
      ]}
    />
  );
}

/** « +1 h 20 par rapport aux 7 jours d'avant » */
function comparison(current: number, previous: number, period: Period) {
  if (current === previous) return `Autant que les ${period} jours d'avant.`;
  const sign = current > previous ? "+" : "−";
  return `${sign}${formatDuration(Math.abs(current - previous))} par rapport aux ${period} jours d'avant.`;
}

async function StatsContent({ searchParams }: PageProps<"/statistiques">) {
  const period = parsePeriod((await searchParams).periode);

  // L'heure actuelle n'est lue qu'au moment de la requête, jamais pendant le prérendu.
  await connection();
  const timeZone = await getTimeZone();
  const today = utcToLocalInput(new Date().toISOString(), timeZone).slice(0, 10);
  const data = await getStatsData(today, timeZone);

  // Temps de travail : la période choisie, et la même durée juste avant pour comparer.
  const both = focusByDay(data.sessions, lastDays(today, period * 2), timeZone);
  const days = both.slice(period);
  const total = days.reduce((sum, d) => sum + d.seconds, 0);
  const previous = both.slice(0, period).reduce((sum, d) => sum + d.seconds, 0);
  const activeDays = days.filter((d) => d.seconds > 0).length;

  const periodSessions = data.sessions.filter((s) =>
    days.some((d) => d.date === localDay(s.startedAt, timeZone)),
  );
  const subjects = focusBySubject(periodSessions);
  const streak = currentStreak(
    data.sessions.map((s) => localDay(s.startedAt, timeZone)),
    today,
  );
  const timeline = averageTimeline(data.units);
  const rate = onTimeRate(data.assignments);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <PeriodSwitch period={period} />
      </div>
      <Card className="lg:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Temps de concentration</CardTitle>
            <p className="text-sm text-ink-soft">
              {period === 7 ? "Les 7 derniers jours" : "Les 30 derniers jours"}
            </p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-full border-2 bg-green">
            <Timer className="size-5" strokeWidth={2.4} aria-hidden />
          </span>
        </div>
        <CardValue className="mt-4 tabular-nums">{formatDuration(total)}</CardValue>
        <p className="mt-1.5 text-sm font-semibold">
          {total === 0 && previous === 0
            ? "Pas encore de session sur cette période."
            : comparison(total, previous, period)}
          {total > 0 && ` Soit ${formatDuration(Math.round(total / period))} par jour en moyenne.`}
        </p>
        <div className="mt-5">
          <FocusBars
            days={days}
            today={today}
            caption={`Temps de concentration par jour, ${period} derniers jours`}
          />
        </div>
        {total === 0 && (
          <ButtonLink href="/pomodoro" variant="outline" size="sm" className="mt-4">
            Lancer une session
          </ButtonLink>
        )}
      </Card>

      <Card>
        <CardTitle>Par matière</CardTitle>
        {subjects.length === 0 ? (
          <p className="mt-3 text-[15px] text-ink-soft">Aucune session sur cette période.</p>
        ) : (
          <ul className="mt-4 grid gap-3.5">
            {subjects.map((subject) => (
              <li key={subject.key}>
                <div className="flex items-baseline justify-between gap-3 text-[15px]">
                  <span className="min-w-0 truncate font-bold">{subject.name}</span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatDuration(subject.seconds)}
                    <span className="ml-1.5 text-[13px] text-ink-soft">
                      {Math.round(subject.share * 100)} %
                    </span>
                  </span>
                </div>
                <div aria-hidden className="mt-1.5 h-3 rounded-full border-2 bg-muted">
                  <div
                    className={cn(
                      "-m-0.5 h-3 rounded-full border-2",
                      subject.color === null ? "bg-surface" : subjectColorClass(subject.color),
                    )}
                    style={{ width: `calc(${Math.max(4, subject.share * 100)}% + 4px)` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-5">
        <Card tone="yellow">
          <div className="flex items-start justify-between gap-3">
            <CardTitle>Régularité</CardTitle>
            <Flame className="size-6" strokeWidth={2.4} aria-hidden />
          </div>
          <CardValue className="mt-3 tabular-nums">
            {streak}
            {streak >= HISTORY_DAYS && "+"}
          </CardValue>
          <p className="mt-1 text-sm font-semibold">
            {streak === 0
              ? "Aucune série en cours : une session aujourd'hui en lance une."
              : `jour${streak > 1 ? "s" : ""} d'affilée avec au moins une session.`}
          </p>
          <p className="mt-2 text-[13px]">
            {activeDays} jour{activeDays > 1 ? "s" : ""} actif{activeDays > 1 ? "s" : ""} sur les{" "}
            {period} derniers.
          </p>
        </Card>

        <Card tone="blue">
          <div className="flex items-start justify-between gap-3">
            <CardTitle>Devoirs rendus à temps</CardTitle>
            <CalendarCheck className="size-6" strokeWidth={2.4} aria-hidden />
          </div>
          {rate.done === 0 ? (
            <p className="mt-3 text-[15px]">Aucun devoir terminé pour l&apos;instant.</p>
          ) : (
            <>
              <CardValue className="mt-3 tabular-nums">
                {rate.onTime}
                <span className="text-2xl"> / {rate.done}</span>
              </CardValue>
              <p className="mt-1 text-sm font-semibold">
                devoirs terminés avant leur échéance ({Math.round((rate.onTime / rate.done) * 100)}{" "}
                %).
              </p>
            </>
          )}
        </Card>
      </div>

      <Card className="lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Évolution de la moyenne</CardTitle>
          {data.semesterName && <Badge>{data.semesterName}</Badge>}
        </div>
        {timeline.length === 0 ? (
          <p className="mt-3 text-[15px] text-ink-soft">
            Aucune note ce semestre. La courbe apparaîtra avec tes premières notes.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-ink-soft">
              Moyenne du semestre après chaque jour de notes. Pointillés : le seuil de 10.
            </p>
            <p className="mt-3 text-sm font-semibold">
              Aujourd&apos;hui :{" "}
              <span className="text-2xl font-extrabold tabular-nums">
                {formatAverage(timeline.at(-1)!.average)}
              </span>
              {timeline.length > 1 &&
                ` (${timeline.at(-1)!.average >= timeline[0].average ? "+" : "−"}${formatAverage(
                  Math.abs(timeline.at(-1)!.average - timeline[0].average),
                )} depuis la première note)`}
            </p>
            {timeline.length > 1 ? (
              <div className="mt-4">
                <AverageLine points={timeline} />
              </div>
            ) : (
              <p className="mt-2 text-[13px] text-ink-soft">
                La courbe apparaîtra à partir de deux jours de notes.
              </p>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="h-72 animate-pulse rounded-card bg-muted lg:col-span-2" />
      <div className="h-56 animate-pulse rounded-card bg-muted" />
      <div className="h-56 animate-pulse rounded-card bg-muted" />
    </div>
  );
}

export default function StatsPage(props: PageProps<"/statistiques">) {
  return (
    <>
      <PageHeader title="Statistiques" description="Ton travail et tes résultats." />
      <Suspense fallback={<StatsSkeleton />}>
        <StatsContent {...props} />
      </Suspense>
    </>
  );
}
