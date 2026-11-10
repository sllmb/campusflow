import { z } from "zod";

/**
 * Variables d'environnement publiques, validées au démarrage.
 * Une variable manquante fait échouer tout de suite avec un message clair,
 * plutôt qu'une erreur obscure plus tard dans une requête Supabase.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export function getPublicEnv() {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!parsed.success) {
    throw new Error(
      "Variables d'environnement Supabase manquantes ou invalides. " +
        "Copiez .env.example en .env.local et remplissez-le.\n" +
        z.prettifyError(parsed.error),
    );
  }

  return parsed.data;
}
