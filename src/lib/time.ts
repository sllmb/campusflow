import { TZDate } from "@date-fns/tz";

/** Fuseau utilisé tant que le navigateur n'a pas donné le sien. */
export const DEFAULT_TIME_ZONE = "Europe/Paris";

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("fr-FR", { timeZone });
    return true;
  } catch {
    return false;
  }
}

const LOCAL_INPUT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** « 2026-11-14T23:59 » saisi dans le fuseau `timeZone` → instant UTC (ISO), ou null si invalide. */
export function localInputToUtc(value: string, timeZone: string): string | null {
  const match = LOCAL_INPUT.exec(value);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number);
  const date = new TZDate(y, mo - 1, d, h, mi, timeZone);
  // Rejette les dates impossibles (31 février…), que Date « corrigerait » en silence.
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return new Date(date.getTime()).toISOString();
}

/** Instant UTC → « 2026-11-14T23:59 » dans le fuseau `timeZone` (valeur d'un input datetime-local). */
export function utcToLocalInput(iso: string, timeZone: string) {
  const date = new TZDate(new Date(iso).getTime(), timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Numéro de jour (jours depuis 1970) de l'instant, dans le fuseau donné : sert à comparer des dates calendaires. */
function dayNumber(date: Date, timeZone: string) {
  const local = new TZDate(date.getTime(), timeZone);
  return Math.round(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate()) / 86_400_000);
}

/** Nombre de jours calendaires entre maintenant et l'échéance (0 = aujourd'hui, -1 = hier). */
export function calendarDaysFrom(now: Date, iso: string, timeZone: string) {
  return dayNumber(new Date(iso), timeZone) - dayNumber(now, timeZone);
}

function format(iso: string, timeZone: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("fr-FR", { timeZone, ...options }).format(new Date(iso));
}

/** « 23:59 » */
export function formatTime(iso: string, timeZone: string) {
  return format(iso, timeZone, { hour: "2-digit", minute: "2-digit" });
}

/** « lun. 17 nov. » */
export function formatShortDay(iso: string, timeZone: string) {
  return format(iso, timeZone, { weekday: "short", day: "numeric", month: "short" });
}

/** Libellé d'échéance lisible : « Aujourd'hui 23:59 », « Demain 08:30 », « jeu. 20 nov. 14:00 ». */
export function formatDue(iso: string, now: Date, timeZone: string) {
  const days = calendarDaysFrom(now, iso, timeZone);
  const time = formatTime(iso, timeZone);
  if (days === 0) return `Aujourd'hui ${time}`;
  if (days === 1) return `Demain ${time}`;
  if (days === -1) return `Hier ${time}`;
  return `${formatShortDay(iso, timeZone)} ${time}`;
}
