/**
 * Liste des comptes du tableau admin (niveau A) — fonctions pures.
 * Seulement des informations de COMPTE : jamais le contenu (notes, devoirs, matières…).
 */

export type AuthUserLike = {
  id: string;
  email?: string;
  created_at: string;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
  banned_until?: string | null;
  app_metadata?: Record<string, unknown>;
  factors?: { status: string }[];
};

export type UserRow = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastSignInAt: string | null;
  confirmed: boolean;
  twoFactor: boolean;
  suspended: boolean;
  reminders: boolean;
  activeThisWeek: boolean;
  isAdmin: boolean;
};

export const USER_FILTERS = [
  { value: "tous", label: "Tous" },
  { value: "actifs", label: "Actifs" },
  { value: "non-confirmes", label: "Non confirmés" },
  { value: "suspendus", label: "Suspendus" },
] as const;

export type UserFilter = (typeof USER_FILTERS)[number]["value"];

export function parseUserFilter(value: unknown): UserFilter {
  return USER_FILTERS.some((f) => f.value === value) ? (value as UserFilter) : "tous";
}

export function toUserRows(
  users: AuthUserLike[],
  context: {
    names: Map<string, string>;
    subscribers: Set<string>;
    activeIds: Set<string>;
    now: Date;
  },
): UserRow[] {
  const weekAgo = context.now.getTime() - 7 * 86_400_000;
  return users
    .map((user) => {
      const signedInRecently =
        !!user.last_sign_in_at && new Date(user.last_sign_in_at).getTime() >= weekAgo;
      return {
        id: user.id,
        email: user.email ?? "",
        name: context.names.get(user.id) ?? "",
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
        confirmed: !!user.email_confirmed_at,
        twoFactor: (user.factors ?? []).some((factor) => factor.status === "verified"),
        suspended:
          !!user.banned_until && new Date(user.banned_until).getTime() > context.now.getTime(),
        reminders: context.subscribers.has(user.id),
        activeThisWeek: context.activeIds.has(user.id) || signedInRecently,
        isAdmin: user.app_metadata?.role === "admin",
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Recherche (e-mail ou prénom, sans tenir compte des majuscules ni des accents) et filtre. */
export function filterUserRows(rows: UserRow[], query: string, filter: UserFilter) {
  const normalize = (text: string) =>
    text
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  const q = normalize(query.trim());
  return rows.filter((row) => {
    if (q && !normalize(`${row.email} ${row.name}`).includes(q)) return false;
    if (filter === "actifs") return row.activeThisWeek && row.confirmed;
    if (filter === "non-confirmes") return !row.confirmed;
    if (filter === "suspendus") return row.suspended;
    return true;
  });
}

/** Un admin ne peut ni se suspendre ni se supprimer lui-même, ni toucher un autre admin. */
export function canManage(target: Pick<UserRow, "id" | "isAdmin">, adminId: string) {
  return target.id !== adminId && !target.isAdmin;
}
