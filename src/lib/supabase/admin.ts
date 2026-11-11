import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Client Supabase avec la clé SECRÈTE : il contourne la RLS et voit les données de tous les
 * comptes. Réservé au rappel du matin (src/app/api/rappels), qui n'est connecté au compte de
 * personne. Ne jamais l'utiliser pour répondre à une requête d'utilisateur.
 */
export function createAdminClient(secretKey: string) {
  return createClient<Database>(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
