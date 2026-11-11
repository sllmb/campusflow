/*
 * Service worker CampusFlow.
 *
 * Rôle : rendre l'app installable et afficher une page propre hors connexion.
 * Confidentialité : les pages et les données de l'utilisateur ne sont JAMAIS mises en cache ;
 * seuls la page /offline, les icônes et les fichiers techniques versionnés (/_next/static) le sont.
 */
const VERSION = "v1";
const STATIC_CACHE = `campusflow-static-${VERSION}`;
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/brand/icon-192.png", "/brand/icon-512.png", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(PRECACHE);
      // Met aussi en cache les feuilles de style, scripts et polices de la page /offline,
      // pour qu'elle s'affiche correctement sans réseau.
      const response = await cache.match(OFFLINE_URL);
      const html = response ? await response.text() : "";
      const assets = [...new Set(html.match(/\/_next\/static\/[^"'\s)]+/g) ?? [])];
      await Promise.all(assets.map((url) => cache.add(url).catch(() => undefined)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("campusflow-") && key !== STATIC_CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Pages : toujours le réseau (données fraîches, rien de personnel en cache) ;
  // sans réseau, la page « hors connexion ».
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match(OFFLINE_URL)) ?? Response.error()),
    );
    return;
  }

  // Fichiers versionnés de Next.js (le nom change à chaque version) et icônes : cache d'abord.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/brand/")) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(STATIC_CACHE);
          cache.put(request, response.clone());
        }
        return response;
      })(),
    );
  }
  // Tout le reste (données, actions serveur…) passe directement par le réseau.
});
