import "server-only";
import { createClient } from "@/lib/supabase/server";

/** La double authentification est-elle activée (au moins un facteur TOTP vérifié) ? */
export async function getTwoFactorEnabled() {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.listFactors();
  return (data?.totp ?? []).some((factor) => factor.status === "verified");
}
