import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { listSubjectOptions, type SubjectOptionGroup } from "@/features/assignments/queries";
import { deleteFocusSession } from "@/features/focus/actions";
import { FocusTimerLoader } from "@/features/focus/components/focus-timer-loader";
import { getFocusToday } from "@/features/focus/queries";
import { clampDeepWork, type FocusPreset } from "@/features/focus/lib/timer";
import { subjectColorClass } from "@/features/subjects/colors";
import { DeleteForm } from "@/features/subjects/components/delete-form";
import { formatDuration } from "@/lib/format";
import { formatTime, utcToLocalInput } from "@/lib/time";
import { getTimeZone } from "@/lib/timezone";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pomodoro" };

/**
 * Réglage proposé par un lien (bouton « Lancer » d'un créneau de révision) :
 * `?mode=deep_work&minutes=90&matiere=<id>`. Les valeurs inconnues sont ignorées.
 */
function readPreset(
  params: Record<string, string | string[] | undefined>,
  groups: SubjectOptionGroup[],
): FocusPreset | undefined {
  const mode = params.mode === "deep_work" || params.mode === "pomodoro" ? params.mode : null;
  if (!mode) return undefined;
  const subject = typeof params.matiere === "string" ? params.matiere : "";
  const known = groups.some((group) => group.options.some((option) => option.id === subject));
  return {
    mode,
    minutes: mode === "deep_work" ? clampDeepWork(Number(params.minutes)) : undefined,
    subjectId: known ? subject : null,
  };
}

async function FocusContent({ searchParams }: PageProps<"/pomodoro">) {
  const params = await searchParams;
  await connection();
  const timeZone = await getTimeZone();
  const today = utcToLocalInput(new Date().toISOString(), timeZone).slice(0, 10);
  const [groups, focus] = await Promise.all([
    listSubjectOptions(today),
    getFocusToday(today, timeZone),
  ]);

  return (
    <>
      <FocusTimerLoader
        groups={groups}
        pomodorosToday={focus.pomodoroCount}
        preset={readPreset(params, groups)}
      />

      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Aujourd&apos;hui</CardTitle>
          <div className="flex gap-1.5">
            <Badge tone="green">{formatDuration(focus.totalSeconds)} de concentration</Badge>
            {focus.pomodoroCount > 0 && <Badge>{focus.pomodoroCount} Pomodoro</Badge>}
          </div>
        </div>
        {focus.sessions.length === 0 ? (
          <p className="mt-3 text-[15px] text-ink-soft">
            Aucune session aujourd&apos;hui. Lance ton premier Pomodoro !
          </p>
        ) : (
          <ul className="mt-3 divide-y-2 divide-dashed divide-ink/15">
            {focus.sessions.map((session) => (
              <li key={session.id} className="flex items-center gap-3 py-2.5">
                <span
                  aria-hidden
                  className={cn(
                    "h-9 w-2 shrink-0 rounded-full border-2",
                    session.subject ? subjectColorClass(session.subject.color) : "bg-muted",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold">
                    {session.subject?.name ?? "Sans matière"}
                  </p>
                  <p className="text-[13px] text-ink-soft">
                    {session.mode === "deep_work" ? "Deep work" : "Pomodoro"} ·{" "}
                    {formatTime(session.started_at, timeZone)} →{" "}
                    {formatTime(session.ended_at, timeZone)}
                    {!session.completed && " · arrêtée avant la fin"}
                  </p>
                </div>
                <span className="font-extrabold tabular-nums">
                  {formatDuration(session.focused_seconds)}
                </span>
                <DeleteForm
                  action={deleteFocusSession}
                  id={session.id}
                  label="Supprimer la session"
                  message="Supprimer cette session ?"
                />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function FocusSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="h-[28rem] animate-pulse rounded-card bg-green/40" />
      <div className="h-72 animate-pulse rounded-card bg-muted" />
    </div>
  );
}

export default function PomodoroPage(props: PageProps<"/pomodoro">) {
  return (
    <>
      <PageHeader
        title="Pomodoro"
        description="Pomodoro de 25 min ou deep work de 1 h à 10 h, par matière."
      />
      <Suspense fallback={<FocusSkeleton />}>
        <FocusContent {...props} />
      </Suspense>
    </>
  );
}
