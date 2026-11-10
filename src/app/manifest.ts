import type { MetadataRoute } from "next";

/** Manifeste de l'app installable (PWA) : nom, couleurs, icônes, page d'ouverture. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "CampusFlow",
    short_name: "CampusFlow",
    description: "Matières, devoirs, notes et Pomodoro : l'organisation de tes études.",
    lang: "fr",
    dir: "ltr",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f4ec",
    theme_color: "#f6f4ec",
    categories: ["education", "productivity"],
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Fond plein et pictogramme dans la zone sûre : utilisable aussi en icône « masquable ».
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Ajouter un devoir", url: "/devoirs?ajouter=1" },
      { name: "Lancer un Pomodoro", url: "/pomodoro" },
      { name: "Mes notes", url: "/notes" },
    ],
  };
}
