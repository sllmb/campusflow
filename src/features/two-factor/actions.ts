"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { mfaErrorMessage } from "./errors";
import { totpCodeSchema } from "./schemas";

export type Enrollment =
  | { ok: true; factorId: string; qrCode: string; secret: string; uri: string }
  | { ok: false; error: string };

/** Étape 1 de l'activation : crée le facteur et renvoie le QR code et la clé secrète. */
export async function startTwoFactorEnrollment(): Promise<Enrollment> {
  const supabase = await createClient();
  const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
  if (listError) return { ok: false, error: mfaErrorMessage(listError) };
  if (factors.totp.some((factor) => factor.status === "verified")) {
    return { ok: false, error: "La double authentification est déjà activée." };
  }

  // Un essai précédent abandonné laisse un facteur non vérifié : on le retire d'abord.
  for (const factor of factors.all) {
    if (factor.factor_type === "totp" && factor.status === "unverified") {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Application d'authentification",
    issuer: "CampusFlow",
  });
  if (error) return { ok: false, error: mfaErrorMessage(error) };

  return {
    ok: true,
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  };
}

/** Étape 2 de l'activation : vérifie un premier code, ce qui active la 2FA. */
export async function confirmTwoFactorEnrollment(
  _prev: FormState<"code">,
  formData: FormData,
): Promise<FormState<"code">> {
  const factorId = formData.get("factorId");
  const code = totpCodeSchema.safeParse(formData.get("code") ?? "");
  if (!code.success) return { fieldErrors: { code: z.flattenError(code.error).formErrors } };
  if (typeof factorId !== "string" || !z.uuid().safeParse(factorId).success) {
    return { error: "Recommence l'activation." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.data });
  if (error) return { error: mfaErrorMessage(error) };

  revalidatePath("/profil");
  return { success: "Double authentification activée." };
}

/** Désactive la 2FA (la session doit déjà être au niveau « code saisi »). */
export async function disableTwoFactor(): Promise<FormState> {
  const supabase = await createClient();
  const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
  if (listError) return { error: mfaErrorMessage(listError) };

  for (const factor of factors.all.filter((f) => f.factor_type === "totp")) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (error) return { error: mfaErrorMessage(error) };
  }
  // Rafraîchit la session : le jeton ne doit plus annoncer de facteur.
  await supabase.auth.refreshSession();

  revalidatePath("/profil");
  return { success: "Double authentification désactivée." };
}

/** À la connexion : vérifie le code et termine l'ouverture de session. */
export async function verifyTwoFactorLogin(
  _prev: FormState<"code">,
  formData: FormData,
): Promise<FormState<"code">> {
  const code = totpCodeSchema.safeParse(formData.get("code") ?? "");
  if (!code.success) return { fieldErrors: { code: z.flattenError(code.error).formErrors } };

  const supabase = await createClient();
  const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
  if (listError) return { error: mfaErrorMessage(listError) };
  const factor = factors.totp.find((f) => f.status === "verified");
  if (!factor) redirect("/dashboard");

  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: factor.id,
    code: code.data,
  });
  if (error) return { error: mfaErrorMessage(error) };

  redirect("/dashboard");
}
