import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Moteurs de recherche : seulement les pages publiques, jamais l'app ni l'API. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/mentions-legales", "/confidentialite"],
      disallow: [
        "/dashboard",
        "/matieres",
        "/devoirs",
        "/notes",
        "/pomodoro",
        "/statistiques",
        "/profil",
        "/questionnaires",
        "/admin",
        "/styleguide",
        "/verification",
        "/nouveau-mot-de-passe",
        "/auth",
        "/api",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
