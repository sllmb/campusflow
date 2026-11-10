import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { buildSchedule } from "@/features/assignments/lib/schedule";
import { listAssignments } from "@/features/assignments/queries";
import {
  AverageWidget,
  FocusWidget,
  NextDueWidget,
  SubjectsWidget,
  UpcomingWidget,
} from "@/features/dashboard/components/widgets";
import { getGradesOverview } from "@/features/grades/queries";
import { Greeting } from "@/features/profile/components/greeting";
import { AvatarLink, UserAvatar } from "@/features/profile/components/user-avatar";
import { utcToLocalInput } from "@/lib/time";
import { getTimeZone } from "@/lib/timezone";

export const metadata: Metadata = { title: "Accueil" };

/** Date du jour en toutes lettres, dans le fuseau de l'utilisateur : « mercredi 11 novembre ». */
async function TodayLabel() {
  await connection();
  const timeZone = await getTimeZone();
  const label = new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  return <>{label.charAt(0).toUpperCase() + label.slice(1)}</>;
}

async function DashboardWidgets() {
  await connection();
  const timeZone = await getTimeZone();
  const now = new Date();
  const today = utcToLocalInput(now.toISOString(), timeZone).slice(0, 10);

  const [assignments, overview] = await Promise.all([
    listAssignments(),
    getGradesOverview(undefined, today),
  ]);
  const schedule = buildSchedule(assignments, now, timeZone);
  // Carte principale : la prochaine échéance à venir ; s'il n'y a que des retards, le plus ancien.
  const next = schedule.pending.find((item) => !item.overdue) ?? schedule.pending[0];

  return (
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4 lg:gap-5">
      <NextDueWidget item={next} />
      <AverageWidget result={overview.result} />
      <FocusWidget />
      <UpcomingWidget
        items={schedule.pending.slice(0, 5)}
        dueThisWeek={schedule.dueThisWeek}
        overdue={schedule.overdue}
      />
      <SubjectsWidget
        semesterName={overview.semester?.name ?? null}
        units={overview.units}
        result={overview.result}
      />
    </div>
  );
}

function WidgetsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4 lg:gap-5">
      <div className="col-span-2 h-44 animate-pulse rounded-card bg-blue/40" />
      <div className="aspect-square animate-pulse rounded-card bg-yellow/40 lg:aspect-auto" />
      <div className="aspect-square animate-pulse rounded-card bg-green/40 lg:aspect-auto" />
      <div className="col-span-2 h-56 animate-pulse rounded-card bg-muted" />
      <div className="col-span-2 h-56 animate-pulse rounded-card bg-muted" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title={
          <Suspense fallback="Salut !">
            <Greeting />
          </Suspense>
        }
        description={
          <Suspense fallback="Voici ta semaine en un coup d'œil.">
            <TodayLabel />
          </Suspense>
        }
        action={
          <div className="flex gap-3">
            <ButtonLink href="/devoirs?ajouter=1" size="icon" aria-label="Ajouter un devoir">
              <Plus strokeWidth={2.6} />
            </ButtonLink>
            <Suspense fallback={<AvatarLink />}>
              <UserAvatar />
            </Suspense>
          </div>
        }
      />
      <Suspense fallback={<WidgetsSkeleton />}>
        <DashboardWidgets />
      </Suspense>
    </>
  );
}
