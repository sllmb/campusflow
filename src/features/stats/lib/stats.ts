/**
 * Statistiques — fonctions pures, sans base de données ni écran.
 *
 * Toutes les dates « jour » sont des dates calendaires « AAAA-MM-JJ » dans le fuseau de
 * l'étudiant. Une session de concentration compte pour le jour où elle a COMMENCÉ : un deep work
 * lancé à 23 h et fini à 1 h compte entièrement pour la veille.
 */
import { addDays } from "@/features/assignments/lib/calendar";
import { roundGrade, semesterResult, type UnitInput } from "@/features/grades/lib/average";
import { utcToLocalInput } from "@/lib/time";

export const PERIODS = [7, 30] as const;
export type Period = (typeof PERIODS)[number];

export function parsePeriod(value: unknown): Period {
  return value === "30" ? 30 : 7;
}

/** Jour local d'un instant UTC. */
export function localDay(iso: string, timeZone: string) {
  return utcToLocalInput(iso, timeZone).slice(0, 10);
}

/** Les `count` jours qui finissent par `last` (inclus), du plus ancien au plus récent. */
export function lastDays(last: string, count: number) {
  return Array.from({ length: count }, (_, i) => addDays(last, i - count + 1));
}

export type SessionInput = {
  startedAt: string;
  focusedSeconds: number;
  subject: { id: string; name: string; color: number } | null;
};

/** Temps de concentration par jour, pour chacun des jours demandés (0 si rien). */
export function focusByDay(sessions: SessionInput[], days: string[], timeZone: string) {
  const totals = new Map(days.map((day) => [day, 0]));
  for (const session of sessions) {
    const day = localDay(session.startedAt, timeZone);
    const current = totals.get(day);
    if (current !== undefined) totals.set(day, current + session.focusedSeconds);
  }
  return days.map((date) => ({ date, seconds: totals.get(date) ?? 0 }));
}

export type SubjectShare = {
  key: string;
  name: string;
  /** null : sessions sans matière. */
  color: number | null;
  seconds: number;
  /** Part du temps total, de 0 à 1. */
  share: number;
};

/** Répartition du temps par matière, de la plus travaillée à la moins travaillée. */
export function focusBySubject(sessions: SessionInput[]): SubjectShare[] {
  const groups = new Map<string, Omit<SubjectShare, "share">>();
  for (const session of sessions) {
    const key = session.subject?.id ?? "none";
    const group = groups.get(key) ?? {
      key,
      name: session.subject?.name ?? "Sans matière",
      color: session.subject?.color ?? null,
      seconds: 0,
    };
    group.seconds += session.focusedSeconds;
    groups.set(key, group);
  }
  const total = [...groups.values()].reduce((sum, group) => sum + group.seconds, 0);
  return [...groups.values()]
    .filter((group) => group.seconds > 0)
    .map((group) => ({ ...group, share: total ? group.seconds / total : 0 }))
    .sort((a, b) => b.seconds - a.seconds || a.name.localeCompare(b.name, "fr"));
}

/**
 * Nombre de jours d'affilée avec au moins une session, en finissant aujourd'hui. Si rien n'a
 * encore été fait aujourd'hui, la série d'hier compte toujours : la journée n'est pas finie.
 */
export function currentStreak(activeDays: Iterable<string>, today: string) {
  const days = new Set(activeDays);
  let day = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}

export type DatedGrade = { date: string; score: number; outOf: number; weight: number };
export type DatedUnit = Omit<UnitInput, "subjects"> & {
  subjects: { id: string; coefficient: number; grades: DatedGrade[] }[];
};

/**
 * Évolution de la moyenne du semestre : un point par jour où des notes ont été reçues, avec la
 * moyenne telle qu'elle était ce soir-là (mêmes règles LMD que la page Notes).
 */
export function averageTimeline(units: DatedUnit[]) {
  const dates = [
    ...new Set(units.flatMap((u) => u.subjects.flatMap((s) => s.grades.map((g) => g.date)))),
  ].sort();

  return dates.flatMap((date) => {
    const { average } = semesterResult(
      units.map((unit) => ({
        ...unit,
        subjects: unit.subjects.map((subject) => ({
          ...subject,
          grades: subject.grades.filter((grade) => grade.date <= date),
        })),
      })),
    );
    return average === null ? [] : [{ date, average: roundGrade(average) }];
  });
}

export type AssignmentInput = { dueAt: string; completedAt: string | null; status: string };

/** Devoirs terminés, et combien l'ont été avant leur échéance. */
export function onTimeRate(assignments: AssignmentInput[]) {
  const done = assignments.filter((a) => a.status === "done" && a.completedAt);
  const onTime = done.filter((a) => new Date(a.completedAt!) <= new Date(a.dueAt)).length;
  return { done: done.length, onTime };
}
