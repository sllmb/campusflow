/**
 * Chemin de retour sûr (paramètre `next`) : seulement une page de CampusFlow, jamais un autre
 * site. Bloque « //site.com », « /\site.com », les adresses complètes et les caractères de
 * contrôle, que les navigateurs interprètent parfois comme un autre domaine.
 */
export function safeNext(next: string | null | undefined, fallback = "/dashboard") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  if (/[\u0000-\u001f\u007f\\]/.test(next)) return fallback;
  try {
    const base = "https://campusflow.invalid";
    const url = new URL(next, base);
    if (url.origin !== base) return fallback;
    return url.pathname + url.search;
  } catch {
    return fallback;
  }
}
