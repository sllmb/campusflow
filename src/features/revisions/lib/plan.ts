/**
 * Planning de révisions — fonctions pures, sans base de données ni écran.
 *
 * Les jours sont des dates calendaires « AAAA-MM-JJ » dans le fuseau de l'étudiant. Le temps est
 * découpé en blocs de 15 min, répartis le plus également possible sur les jours disponibles ;
 * les blocs en trop vont aux jours les plus proches de l'examen.
 */
import { addDays, capitalize, dayLabel } from "@/features/assignments/lib/calendar";

export const BLOCK_MINUTES = 15;
/** Au plus 10 h de révision par jour (comme un deep work). */
export const MAX_MINUTES_PER_DAY = 600;
/** Au plus 200 h pour un plan. */
export const MAX_TOTAL_MINUTES = 12_000;

/** Lundi = 0 … dimanche = 6. */
export function weekdayIndex(date: string) {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
}

export const WEEKDAYS = [
  { index: 0, short: "Lun.", long: "lundi" },
  { index: 1, short: "Mar.", long: "mardi" },
  { index: 2, short: "Mer.", long: "mercredi" },
  { index: 3, short: "Jeu.", long: "jeudi" },
  { index: 4, short: "Ven.", long: "vendredi" },
  { index: 5, short: "Sam.", long: "samedi" },
  { index: 6, short: "Dim.", long: "dimanche" },
] as const;

/** Jours où l'on peut réviser : d'aujourd'hui à la veille de l'examen, aux jours choisis. */
export function availableDays(today: string, examDay: string, weekdays: number[]) {
  const days: string[] = [];
  for (let day = today; day < examDay; day = addDays(day, 1)) {
    if (weekdays.includes(weekdayIndex(day))) days.push(day);
  }
  return days;
}

export type PlannedSlot = { date: string; minutes: number };

export type PlanResult =
  | { ok: true; slots: PlannedSlot[] }
  | { ok: false; reason: "no-days" }
  | { ok: false; reason: "too-much"; maxMinutes: number };

export function planRevisions(input: {
  today: string;
  examDay: string;
  totalMinutes: number;
  weekdays: number[];
}): PlanResult {
  const days = availableDays(input.today, input.examDay, input.weekdays);
  if (days.length === 0) return { ok: false, reason: "no-days" };

  const blocks = Math.round(input.totalMinutes / BLOCK_MINUTES);
  const base = Math.floor(blocks / days.length);
  const extra = blocks % days.length;

  // Les `extra` derniers jours reçoivent un bloc de plus.
  const slots = days
    .map((date, i) => ({
      date,
      minutes: (base + (i >= days.length - extra ? 1 : 0)) * BLOCK_MINUTES,
    }))
    .filter((slot) => slot.minutes > 0);

  if (slots.some((slot) => slot.minutes > MAX_MINUTES_PER_DAY)) {
    return { ok: false, reason: "too-much", maxMinutes: days.length * MAX_MINUTES_PER_DAY };
  }
  return { ok: true, slots };
}

export type SlotState = { planned_on: string; minutes: number; done: boolean };

/** Résumé d'un plan : temps fait, temps prévu, prochain créneau à faire. */
export function summarize(slots: SlotState[], today: string) {
  const total = slots.reduce((sum, slot) => sum + slot.minutes, 0);
  const done = slots.filter((slot) => slot.done).reduce((sum, slot) => sum + slot.minutes, 0);
  const next = slots
    .filter((slot) => !slot.done && slot.planned_on >= today)
    .sort((a, b) => a.planned_on.localeCompare(b.planned_on))[0];
  const missed = slots.filter((slot) => !slot.done && slot.planned_on < today).length;
  return { total, done, next: next ?? null, missed };
}

/** « Aujourd'hui », « Demain », « Hier », sinon « Mardi 17 novembre ». */
export function slotDayLabel(date: string, today: string) {
  if (date === today) return "Aujourd'hui";
  if (date === addDays(today, 1)) return "Demain";
  if (date === addDays(today, -1)) return "Hier";
  return capitalize(dayLabel(date));
}

/** Lien qui ouvre le minuteur réglé pour ce créneau : deep work dès 1 h, sinon Pomodoro. */
export function launchHref(slot: { minutes: number; subjectId: string }) {
  const params = new URLSearchParams(
    slot.minutes >= 60
      ? { mode: "deep_work", minutes: String(slot.minutes), matiere: slot.subjectId }
      : { mode: "pomodoro", matiere: slot.subjectId },
  );
  return `/pomodoro?${params}`;
}
