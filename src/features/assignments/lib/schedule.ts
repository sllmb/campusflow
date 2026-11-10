import { calendarDaysFrom, formatDue, utcToLocalInput } from "@/lib/time";
import type { AssignmentWithSubject } from "../queries";

export type AssignmentView = AssignmentWithSubject & {
  dueLabel: string;
  dueLocal: string;
  overdue: boolean;
};

export type BucketKey = "overdue" | "today" | "tomorrow" | "week" | "later";

export const BUCKET_TITLES: Record<BucketKey, string> = {
  overdue: "En retard",
  today: "Aujourd'hui",
  tomorrow: "Demain",
  week: "Cette semaine",
  later: "Plus tard",
};

export type Schedule = {
  buckets: { key: BucketKey; title: string; items: AssignmentView[] }[];
  /** Pas encore terminés, du plus urgent au moins urgent (retards d'abord). */
  pending: AssignmentView[];
  done: AssignmentView[];
  /** Pas terminés et dus dans les 7 prochains jours (aujourd'hui compris). */
  dueThisWeek: number;
  overdue: number;
};

/** Classe les échéances par urgence, dans le fuseau de l'utilisateur. */
export function buildSchedule(
  assignments: AssignmentWithSubject[],
  now: Date,
  timeZone: string,
): Schedule {
  const keys: BucketKey[] = ["overdue", "today", "tomorrow", "week", "later"];
  const groups = Object.fromEntries(keys.map((key) => [key, [] as AssignmentView[]])) as Record<
    BucketKey,
    AssignmentView[]
  >;
  const done: AssignmentView[] = [];

  for (const assignment of assignments) {
    const days = calendarDaysFrom(now, assignment.due_at, timeZone);
    const overdue = assignment.status !== "done" && new Date(assignment.due_at) < now;
    const view: AssignmentView = {
      ...assignment,
      overdue,
      dueLabel: formatDue(assignment.due_at, now, timeZone),
      dueLocal: utcToLocalInput(assignment.due_at, timeZone),
    };
    if (assignment.status === "done") done.push(view);
    else if (overdue) groups.overdue.push(view);
    else if (days === 0) groups.today.push(view);
    else if (days === 1) groups.tomorrow.push(view);
    else if (days < 7) groups.week.push(view);
    else groups.later.push(view);
  }

  done.sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
  const pending = keys.flatMap((key) => groups[key]);

  return {
    buckets: keys.map((key) => ({ key, title: BUCKET_TITLES[key], items: groups[key] })),
    pending,
    done,
    dueThisWeek: groups.today.length + groups.tomorrow.length + groups.week.length,
    overdue: groups.overdue.length,
  };
}
