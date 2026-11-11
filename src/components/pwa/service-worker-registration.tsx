"use client";

import { useEffect } from "react";

/** Enregistre le service worker (en production uniquement, pour ne pas gêner le développement). */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Échec sans gravité : l'app marche, seulement sans page hors connexion.
    });
  }, []);
  return null;
}
