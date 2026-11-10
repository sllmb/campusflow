import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** N'accepte que des chemins internes, pour éviter les redirections vers un autre site. */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

/**
 * Lien reçu par e-mail (confirmation d'inscription, réinitialisation…).
 * Gère les deux formats de Supabase : `token_hash` + `type`, ou `code` (PKCE).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  const supabase = await createClient();
  let ok = false;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  const url = request.nextUrl.clone();
  url.search = "";
  if (ok) {
    url.pathname = next;
  } else {
    url.pathname = "/login";
    url.searchParams.set("erreur", "lien");
  }
  return NextResponse.redirect(url);
}
