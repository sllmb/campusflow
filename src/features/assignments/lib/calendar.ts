/**
 * Calendrier : calculs de dates purs, sans base de données ni écran.
 *
 * Les jours sont des chaînes « AAAA-MM-JJ » (dates calendaires, sans heure ni fuseau). Les
 * calculs passent par Date.UTC, qui ne connaît ni heure d'été ni fuseau : un jour vaut toujours
 * exactement 24 h, ce qui évite les décalages d'un jour.
 */

export type CalendarView = "mois" | "semaine";

export type CalendarDay = {
  /** « 2026-11-17 » */
  date: string;
  /** Jour du mois : 17 */
  day: number;
  /** Faux pour les jours du mois précédent ou suivant, affichés en grisé. */
  inMonth: boolean;
};

const DAY_MS = 86_400_000;
const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function toUtc(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtc(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}

/** « 2026-11-17 » si la valeur est une vraie date, sinon null (rejette le 31 février). */
export function parseDay(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = DAY_PATTERN.exec(value);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  if (y < 1970 || y > 9999) return null;
  return fromUtc(Date.UTC(y, m - 1, d)) === value ? value : null;
}

export function parseView(value: unknown): CalendarView {
  return value === "semaine" ? "semaine" : "mois";
}

export function addDays(date: string, days: number) {
  return fromUtc(toUtc(date) + days * DAY_MS);
}

/** Lundi de la semaine qui contient ce jour (semaines du lundi au dimanche). */
export function startOfWeek(date: string) {
  const weekday = (new Date(toUtc(date)).getUTCDay() + 6) % 7; // lundi = 0 … dimanche = 6
  return addDays(date, -weekday);
}

/** Premier jour du mois décalé de `months` mois (−1 = mois précédent). */
export function shiftMonth(date: string, months: number) {
  const [y, m] = date.split("-").map(Number);
  return fromUtc(Date.UTC(y, m - 1 + months, 1));
}

/** Les 7 jours de la semaine qui contient ce jour, du lundi au dimanche. */
export function weekDays(date: string): CalendarDay[] {
  const monday = startOfWeek(date);
  const month = date.slice(0, 7);
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(monday, i);
    return { date: day, day: Number(day.slice(8)), inMonth: day.slice(0, 7) === month };
  });
}

/**
 * Grille du mois qui contient ce jour : des semaines complètes du lundi au dimanche (4 à 6),
 * avec les jours du mois précédent et suivant pour compléter les lignes.
 */
export function monthGrid(date: string): CalendarDay[][] {
  const first = shiftMonth(date, 0);
  const month = first.slice(0, 7);
  const weeks: CalendarDay[][] = [];
  for (let monday = startOfWeek(first); monday.slice(0, 7) <= month; monday = addDays(monday, 7)) {
    weeks.push(
      Array.from({ length: 7 }, (_, i) => {
        const day = addDays(monday, i);
        return { date: day, day: Number(day.slice(8)), inMonth: day.slice(0, 7) === month };
      }),
    );
  }
  return weeks;
}

/** Premier et dernier jour affichés par la vue (grille complète du mois, ou semaine). */
export function visibleRange(view: CalendarView, date: string) {
  if (view === "semaine") {
    const monday = startOfWeek(date);
    return { first: monday, last: addDays(monday, 6) };
  }
  const weeks = monthGrid(date);
  return { first: weeks[0][0].date, last: weeks[weeks.length - 1][6].date };
}

/** Jour affiché quand on passe à la période précédente (−1) ou suivante (+1). */
export function stepDate(view: CalendarView, date: string, direction: -1 | 1) {
  return view === "semaine" ? addDays(date, 7 * direction) : shiftMonth(date, direction);
}

/** Regroupe des éléments par jour, à partir d'une date locale « 2026-11-17T23:59 ». */
export function groupByDay<T extends { dueLocal: string }>(items: T[]) {
  const byDay = new Map<string, T[]>();
  for (const item of items) {
    const day = item.dueLocal.slice(0, 10);
    const list = byDay.get(day);
    if (list) list.push(item);
    else byDay.set(day, [item]);
  }
  for (const list of byDay.values()) list.sort((a, b) => a.dueLocal.localeCompare(b.dueLocal));
  return byDay;
}

function format(date: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", ...options }).format(toUtc(date));
}

/** « novembre 2026 » */
export function monthLabel(date: string) {
  return format(date, { month: "long", year: "numeric" });
}

/** « mardi 17 novembre » */
export function dayLabel(date: string) {
  return format(date, { weekday: "long", day: "numeric", month: "long" });
}

/** « mardi » → « Mardi », pour un titre. */
export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** « 16 – 22 nov. 2026 », ou « 30 nov. – 6 déc. 2026 » à cheval sur deux mois. */
export function weekLabel(date: string) {
  const monday = startOfWeek(date);
  const sunday = addDays(monday, 6);
  const end = format(sunday, { day: "numeric", month: "short", year: "numeric" });
  const sameMonth = monday.slice(0, 7) === sunday.slice(0, 7);
  const start = format(monday, sameMonth ? { day: "numeric" } : { day: "numeric", month: "short" });
  return `${start} – ${end}`;
}

/** Initiales des jours, du lundi au dimanche. */
export const WEEKDAY_INITIALS = [
  { short: "L", long: "lundi" },
  { short: "M", long: "mardi" },
  { short: "M", long: "mercredi" },
  { short: "J", long: "jeudi" },
  { short: "V", long: "vendredi" },
  { short: "S", long: "samedi" },
  { short: "D", long: "dimanche" },
] as const;
