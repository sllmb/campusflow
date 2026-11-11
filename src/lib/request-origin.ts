import "server-only";
import { headers } from "next/headers";

/**
 * Adresse publique du site pour les liens envoyés par e-mail (confirmation, réinitialisation).
 * Ordre : en-tête Origin (formulaires), puis hôte transmis par Vercel, puis variable de secours.
 * Supabase n'accepte de toute façon que les adresses de sa liste « Redirect URLs ».
 */
export async function getRequestOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) return `${h.get("x-forwarded-proto") ?? "https"}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "";
}
