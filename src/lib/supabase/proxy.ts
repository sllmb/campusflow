import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/** Pages accessibles sans être connecté (en plus de la page d'accueil « / »). */
const PUBLIC_PATHS = ["/login", "/signup", "/auth", "/mentions-legales", "/confidentialite"];
/** Pages réservées aux visiteurs non connectés (un utilisateur connecté est renvoyé à l'accueil). */
const GUEST_ONLY_PATHS = ["/login", "/signup"];

function matches(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Rafraîchit la session Supabase à chaque requête et protège les pages de l'app.
 * Appelé depuis `src/proxy.ts`.
 */
export async function updateSession(request: NextRequest) {
  const env = getPublicEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // Ne rien exécuter entre la création du client et getClaims() :
  // c'est cet appel qui vérifie le jeton et le renouvelle si besoin.
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    const redirect = NextResponse.redirect(url);
    // Garder les cookies de session éventuellement renouvelés.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  const isPublic = pathname === "/" || matches(pathname, PUBLIC_PATHS);

  // Double authentification : une session ouverte avec le seul mot de passe (« aal1 ») sur un
  // compte qui a activé la 2FA doit d'abord passer par /verification.
  let needsCode = false;
  if (isSignedIn) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    needsCode = aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2";
  }

  if (pathname === "/verification") {
    if (!isSignedIn) return redirectTo("/login");
    if (!needsCode) return redirectTo("/dashboard");
    return response;
  }
  if (!isSignedIn && !isPublic) {
    return redirectTo("/login");
  }
  if (needsCode && !matches(pathname, ["/auth", "/mentions-legales", "/confidentialite"])) {
    return redirectTo("/verification");
  }
  if (isSignedIn && (pathname === "/" || matches(pathname, GUEST_ONLY_PATHS))) {
    return redirectTo("/dashboard");
  }

  return response;
}
