/** Adresse publique du site en production (robots.txt, plan du site, aperçus de partage). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://campusflow-two-chi.vercel.app"
).replace(/\/$/, "");
