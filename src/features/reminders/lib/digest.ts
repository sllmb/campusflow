/**
 * Rappel du matin — fonction pure : à partir des échéances et des révisions d'un étudiant,
 * écrit la notification, ou renvoie null s'il n'y a rien à dire.
 */
import { addDays } from "@/features/assignments/lib/calendar";
import { formatMinutes } from "@/features/focus/lib/timer";
import { formatTime, utcToLocalInput } from "@/lib/time";

export type DigestAssignment = {
  title: string;
  kind: string;
  status: string;
  /** Instant UTC (ISO). */
  dueAt: string;
};

export type DigestRevision = { plannedOn: string; minutes: number; done: boolean };

export type Digest = { title: string; body: string; url: string };

/** Au plus deux titres par ligne, puis « et N autres ». */
function list(items: DigestAssignment[], timeZone: string) {
  const shown = items.slice(0, 2).map((a) => `${a.title} (${formatTime(a.dueAt, timeZone)})`);
  const rest = items.length - shown.length;
  if (rest > 0) shown.push(`${rest} autre${rest > 1 ? "s" : ""}`);
  return shown.length > 1 ? `${shown.slice(0, -1).join(", ")} et ${shown.at(-1)}` : shown[0];
}

export function buildDigest(input: {
  today: string;
  timeZone: string;
  assignments: DigestAssignment[];
  revisions: DigestRevision[];
}): Digest | null {
  const { today, timeZone } = input;
  const tomorrow = addDays(today, 1);
  const day = (iso: string) => utcToLocalInput(iso, timeZone).slice(0, 10);
  const pending = input.assignments
    .filter((a) => a.status !== "done")
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));

  const dueToday = pending.filter((a) => day(a.dueAt) === today);
  const overdue = pending.filter((a) => day(a.dueAt) < today).length;
  const examsTomorrow = pending.filter((a) => a.kind !== "homework" && day(a.dueAt) === tomorrow);
  const revisionMinutes = input.revisions
    .filter((r) => r.plannedOn === today && !r.done)
    .reduce((sum, r) => sum + r.minutes, 0);

  const lines: string[] = [];
  if (dueToday.length) lines.push(`Aujourd'hui : ${list(dueToday, timeZone)}`);
  if (revisionMinutes) lines.push(`Révisions : ${formatMinutes(revisionMinutes)}`);
  if (examsTomorrow.length) lines.push(`Demain : ${list(examsTomorrow, timeZone)}`);
  if (overdue) lines.push(`En retard : ${overdue}`);
  if (lines.length === 0) return null;

  return {
    title: dueToday.length || revisionMinutes ? "Ta journée sur CampusFlow" : "À préparer",
    body: lines.join("\n"),
    url: "/dashboard",
  };
}

/**
 * Faut-il prévenir cet appareil maintenant ? Oui s'il est au moins `hour` heures dans son fuseau
 * et qu'il n'a pas déjà reçu le rappel aujourd'hui. Renvoie aussi « aujourd'hui » (jour local).
 */
export function reminderDue(now: Date, timeZone: string, lastSentOn: string | null, hour: number) {
  const local = utcToLocalInput(now.toISOString(), timeZone);
  const today = local.slice(0, 10);
  const due = Number(local.slice(11, 13)) >= hour && lastSentOn !== today;
  return { due, today };
}
