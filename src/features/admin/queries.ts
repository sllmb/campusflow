import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getServerSecrets } from "@/lib/server-secrets";
import { adminAccess, type AccountInfo } from "./lib/adoption";
import { canManage, toUserRows, type AuthUserLike, type UserRow } from "./lib/users";

/** « granted », « needs-2fa » ou « denied », d'après la session de la personne connectée. */
export async function getAdminAccess() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return adminAccess(data?.claims);
}

/**
 * Client à clé secrète, seulement pour un administrateur qui a saisi son code 2FA.
 * Toute fonction de ce fichier qui lit les données de tous les comptes passe par ici.
 */
async function adminSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (adminAccess(data?.claims) !== "granted" || !data?.claims.sub) {
    throw new Error("Accès admin refusé.");
  }
  const { supabaseSecretKey } = getServerSecrets();
  if (!supabaseSecretKey) throw new Error("SUPABASE_SECRET_KEY n'est pas configurée.");
  return { admin: createAdminClient(supabaseSecretKey), adminId: data.claims.sub };
}

async function adminClientFor() {
  return (await adminSession()).admin;
}

type AdminClient = Awaited<ReturnType<typeof adminClientFor>>;

/** Tous les comptes d'authentification (Supabase les donne par pages de 1 000). */
async function listAuthUsers(admin: AdminClient): Promise<AuthUserLike[]> {
  const users: AuthUserLike[] = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) return users;
  }
}

/** Tous les comptes, sans e-mail ni prénom : seulement des dates et un identifiant. */
async function listAccounts(admin: AdminClient): Promise<AccountInfo[]> {
  return (await listAuthUsers(admin)).map((user) => ({
    id: user.id,
    createdAt: user.created_at,
    confirmedAt: user.email_confirmed_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
  }));
}

/** Comptes ayant créé ou modifié quelque chose depuis `since` (identifiants seulement). */
async function recentActivityIds(admin: AdminClient, since: string) {
  const results = await Promise.all([
    admin.from("assignments").select("user_id").gte("updated_at", since),
    admin.from("grades").select("user_id").gte("updated_at", since),
    admin.from("focus_sessions").select("user_id").gte("created_at", since),
    admin.from("revision_sessions").select("user_id").gte("updated_at", since),
  ]);
  const ids = new Set<string>();
  for (const result of results) {
    if (result.error) throw result.error;
    result.data.forEach((row) => ids.add(row.user_id));
  }
  return ids;
}

/** Nombre de lignes d'une table, sans les lire. */
async function count(admin: AdminClient, table: "semesters" | "assignments" | "grades") {
  const { count: total, error } = await admin
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return total ?? 0;
}

export type AdoptionData = {
  accounts: AccountInfo[];
  /** Comptes ayant créé ou modifié quelque chose ces 7 derniers jours. */
  activeIds: Set<string>;
  reminders: { subscribers: number; sentToday: number };
  content: { semesters: number; assignments: number; grades: number; focusHours: number };
};

export async function getAdoptionData(today: string): Promise<AdoptionData> {
  const admin = await adminClientFor();
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [accounts, activeIds, focus, subscriptions, semesters, totals] = await Promise.all([
    listAccounts(admin),
    recentActivityIds(admin, since),
    admin.from("focus_sessions").select("focused_seconds"),
    admin.from("push_subscriptions").select("user_id, last_sent_on"),
    count(admin, "semesters"),
    Promise.all([count(admin, "assignments"), count(admin, "grades")]),
  ]);
  if (focus.error) throw focus.error;
  if (subscriptions.error) throw subscriptions.error;
  const focusSeconds = focus.data.reduce((sum, row) => sum + row.focused_seconds, 0);

  return {
    accounts,
    activeIds,
    reminders: {
      subscribers: new Set(subscriptions.data.map((row) => row.user_id)).size,
      sentToday: subscriptions.data.filter((row) => row.last_sent_on === today).length,
    },
    content: {
      semesters,
      assignments: totals[0],
      grades: totals[1],
      focusHours: Math.round(focusSeconds / 3600),
    },
  };
}

/** Supprime les comptes jamais confirmés depuis plus de 7 jours. Renvoie leur nombre. */
export async function deleteStaleAccounts(isStale: (account: AccountInfo) => boolean) {
  const admin = await adminClientFor();
  const stale = (await listAccounts(admin)).filter(isStale);
  for (const account of stale) {
    const { error } = await admin.auth.admin.deleteUser(account.id);
    if (error) throw error;
  }
  return stale.length;
}

/** La liste des comptes (niveau A : informations de compte, jamais le contenu). */
export async function getUserRows(): Promise<{ rows: UserRow[]; adminId: string }> {
  const { admin, adminId } = await adminSession();
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [users, profiles, subscriptions, activeIds] = await Promise.all([
    listAuthUsers(admin),
    admin.from("profiles").select("id, display_name"),
    admin.from("push_subscriptions").select("user_id"),
    recentActivityIds(admin, since),
  ]);
  if (profiles.error) throw profiles.error;
  if (subscriptions.error) throw subscriptions.error;
  return {
    adminId,
    rows: toUserRows(users, {
      names: new Map(profiles.data.map((profile) => [profile.id, profile.display_name])),
      subscribers: new Set(subscriptions.data.map((row) => row.user_id)),
      activeIds,
      now: new Date(),
    }),
  };
}

/**
 * Suspend, réactive ou supprime un compte. Refusé pour soi-même et pour un autre admin.
 * Chaque action est journalisée (identifiants seulement) dans les logs de Vercel.
 */
export async function manageUser(targetId: string, action: "suspend" | "reactivate" | "delete") {
  const { admin, adminId } = await adminSession();
  const { data, error } = await admin.auth.admin.getUserById(targetId);
  if (error || !data.user) throw new Error("Compte introuvable.");
  const isAdmin = data.user.app_metadata?.role === "admin";
  if (!canManage({ id: targetId, isAdmin }, adminId)) throw new Error("Action interdite.");

  const result =
    action === "delete"
      ? await admin.auth.admin.deleteUser(targetId)
      : await admin.auth.admin.updateUserById(targetId, {
          // Suspension : connexion refusée pendant 100 ans, jusqu'à réactivation.
          ban_duration: action === "suspend" ? "876000h" : "none",
        });
  if (result.error) throw result.error;
  console.info(`[admin] ${action} du compte ${targetId} par ${adminId}`);
}

/**
 * Prénom et e-mail de quelques comptes, pour les formulaires NOMINATIFS (l'étudiant en a été
 * prévenu avant de répondre). Sans clé secrète configurée : liste vide.
 */
export async function getRespondents(userIds: string[]) {
  const respondents = new Map<string, { name: string; email: string }>();
  if (userIds.length === 0 || !getServerSecrets().supabaseSecretKey) return respondents;
  const { admin } = await adminSession();
  const wanted = new Set(userIds);
  const [users, profiles] = await Promise.all([
    listAuthUsers(admin),
    admin
      .from("profiles")
      .select("id, display_name")
      .in("id", [...wanted]),
  ]);
  if (profiles.error) throw profiles.error;
  const names = new Map(profiles.data.map((profile) => [profile.id, profile.display_name]));
  for (const user of users) {
    if (wanted.has(user.id)) {
      respondents.set(user.id, { name: names.get(user.id) ?? "", email: user.email ?? "" });
    }
  }
  return respondents;
}
