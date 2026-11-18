import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getServerSecrets } from "@/lib/server-secrets";
import { adminAccess, type AccountInfo } from "./lib/adoption";

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
async function adminClientFor() {
  if ((await getAdminAccess()) !== "granted") throw new Error("Accès admin refusé.");
  const { supabaseSecretKey } = getServerSecrets();
  if (!supabaseSecretKey) throw new Error("SUPABASE_SECRET_KEY n'est pas configurée.");
  return createAdminClient(supabaseSecretKey);
}

type AdminClient = Awaited<ReturnType<typeof adminClientFor>>;

/** Tous les comptes, sans e-mail ni prénom : seulement des dates et un identifiant. */
async function listAccounts(admin: AdminClient): Promise<AccountInfo[]> {
  const accounts: AccountInfo[] = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const user of data.users) {
      accounts.push({
        id: user.id,
        createdAt: user.created_at,
        confirmedAt: user.email_confirmed_at ?? null,
        lastSignInAt: user.last_sign_in_at ?? null,
      });
    }
    if (data.users.length < 1000) return accounts;
  }
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

  const [accounts, assignments, grades, focus, revisions, subscriptions, semesters, totals] =
    await Promise.all([
      listAccounts(admin),
      admin.from("assignments").select("user_id").gte("updated_at", since),
      admin.from("grades").select("user_id").gte("updated_at", since),
      admin.from("focus_sessions").select("user_id, focused_seconds, created_at"),
      admin.from("revision_sessions").select("user_id").gte("updated_at", since),
      admin.from("push_subscriptions").select("user_id, last_sent_on"),
      count(admin, "semesters"),
      Promise.all([count(admin, "assignments"), count(admin, "grades")]),
    ]);
  for (const result of [assignments, grades, focus, revisions, subscriptions]) {
    if (result.error) throw result.error;
  }

  const activeIds = new Set([
    ...assignments.data!.map((row) => row.user_id),
    ...grades.data!.map((row) => row.user_id),
    ...revisions.data!.map((row) => row.user_id),
    ...focus.data!.filter((row) => row.created_at >= since).map((row) => row.user_id),
  ]);
  const focusSeconds = focus.data!.reduce((sum, row) => sum + row.focused_seconds, 0);

  return {
    accounts,
    activeIds,
    reminders: {
      subscribers: new Set(subscriptions.data!.map((row) => row.user_id)).size,
      sentToday: subscriptions.data!.filter((row) => row.last_sent_on === today).length,
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
