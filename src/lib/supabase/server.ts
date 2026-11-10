import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Client Supabase côté serveur (Server Components, Server Actions, Route Handlers).
 * Un nouveau client par requête : il lit et écrit la session dans les cookies.
 */
export async function createClient() {
  // cookies() et connection() d'abord : le rendu est reporté au moment de la requête,
  // avant de lire les variables d'environnement et avant que Supabase ne lise l'heure
  // (Date.now) pour vérifier l'expiration de la session, ce que Next.js interdit pendant
  // le prérendu.
  const cookieStore = await cookies();
  await connection();
  const env = getPublicEnv();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Appelé depuis un Server Component : les cookies y sont en lecture seule.
            // Sans gravité, le proxy rafraîchit la session à chaque requête.
          }
        },
      },
    },
  );
}
