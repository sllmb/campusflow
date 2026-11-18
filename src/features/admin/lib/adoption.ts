/**
 * Chiffres d'adoption — fonctions pures. Elles ne reçoivent que des dates et des identifiants :
 * jamais d'e-mail, de prénom ni de contenu (notes, devoirs…).
 */
import { lastDays, localDay } from "@/features/stats/lib/stats";

export type AccountInfo = {
  id: string;
  createdAt: string;
  /** null : adresse jamais confirmée. */
  confirmedAt: string | null;
  lastSignInAt: string | null;
};

const DAY_MS = 86_400_000;

/** Compte jamais confirmé, créé il y a plus de `days` jours : très souvent un robot ou une erreur. */
export function isStaleUnconfirmed(account: AccountInfo, now: Date, days = 7) {
  return (
    account.confirmedAt === null &&
    new Date(account.createdAt).getTime() < now.getTime() - days * DAY_MS
  );
}

/** Les chiffres du tableau admin. `activeIds` : comptes ayant écrit quelque chose récemment. */
export function adoptionSummary(accounts: AccountInfo[], activeIds: Set<string>, now: Date) {
  const weekAgo = now.getTime() - 7 * DAY_MS;
  const confirmed = accounts.filter((a) => a.confirmedAt !== null);
  const active = confirmed.filter(
    (a) =>
      activeIds.has(a.id) ||
      (a.lastSignInAt !== null && new Date(a.lastSignInAt).getTime() >= weekAgo),
  );
  return {
    total: accounts.length,
    confirmed: confirmed.length,
    active7: active.length,
    new7: accounts.filter((a) => new Date(a.createdAt).getTime() >= weekAgo).length,
    staleUnconfirmed: accounts.filter((a) => isStaleUnconfirmed(a, now)).length,
  };
}

/** Inscriptions par jour sur les `count` derniers jours (jour local de l'éditeur). */
export function signupsByDay(
  accounts: AccountInfo[],
  today: string,
  count: number,
  timeZone: string,
) {
  const days = lastDays(today, count);
  const totals = new Map(days.map((day) => [day, 0]));
  for (const account of accounts) {
    const day = localDay(account.createdAt, timeZone);
    const current = totals.get(day);
    if (current !== undefined) totals.set(day, current + 1);
  }
  return days.map((date) => ({ date, value: totals.get(date) ?? 0 }));
}

/** Accès au tableau admin : rôle « admin » posé par Supabase ET code 2FA saisi. */
export function adminAccess(claims: { app_metadata?: unknown; aal?: unknown } | null | undefined) {
  const role =
    claims?.app_metadata && typeof claims.app_metadata === "object"
      ? (claims.app_metadata as { role?: unknown }).role
      : undefined;
  if (role !== "admin") return "denied" as const;
  return claims?.aal === "aal2" ? ("granted" as const) : ("needs-2fa" as const);
}
