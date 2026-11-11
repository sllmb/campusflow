"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { authErrorMessage, logAuthError } from "./errors";
import { newPasswordSchema, resetRequestSchema, signInSchema, signUpSchema } from "./schemas";
import type { FormState } from "@/lib/form-state";

type SignInField = "email" | "password";
type SignUpField = "displayName" | "email" | "password";

export async function signIn(
  _prev: FormState<SignInField>,
  formData: FormData,
): Promise<FormState<SignInField>> {
  const values = { email: String(formData.get("email") ?? "") };
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code !== "invalid_credentials") logAuthError("signIn", error);
    return { error: authErrorMessage(error), values };
  }

  // Double authentification activée : le code est demandé avant d'entrer dans l'app.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") redirect("/verification");

  redirect("/dashboard");
}

export async function signUp(
  _prev: FormState<SignUpField>,
  formData: FormData,
): Promise<FormState<SignUpField>> {
  const values = {
    displayName: String(formData.get("displayName") ?? ""),
    email: String(formData.get("email") ?? ""),
  };
  const parsed = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/dashboard`,
      data: { display_name: parsed.data.displayName },
    },
  });
  if (error) {
    logAuthError("signUp", error);
    return { error: authErrorMessage(error), values };
  }

  // Confirmation par e-mail désactivée : la session est ouverte tout de suite.
  if (data.session) redirect("/dashboard");

  // Même message si l'adresse est déjà inscrite : on ne révèle pas quels e-mails ont un compte.
  return {
    success: `C'est presque fini ! Ouvre le mail envoyé à ${parsed.data.email} et clique sur le lien pour activer ton compte.`,
  };
}

export async function signOut() {
  const supabase = await createClient();
  // Déconnecte seulement cet appareil, pas les autres sessions de l'utilisateur.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}

/** Envoie l'e-mail de réinitialisation du mot de passe. */
export async function requestPasswordReset(
  _prev: FormState<"email">,
  formData: FormData,
): Promise<FormState<"email">> {
  const values = { email: String(formData.get("email") ?? "") };
  const parsed = resetRequestSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm?next=/nouveau-mot-de-passe`,
  });
  // Seule la limite d'envoi est signalée : les autres cas reçoivent le message habituel,
  // pour ne pas révéler si un compte existe pour cette adresse.
  if (error?.code === "over_email_send_rate_limit" || error?.code === "over_request_rate_limit") {
    return { error: authErrorMessage(error), values };
  }
  if (error) logAuthError("resetRequest", error);

  return {
    success: `Si un compte existe pour ${parsed.data.email}, un e-mail vient de partir. Ouvre-le et touche le lien pour choisir un nouveau mot de passe.`,
  };
}

/** Enregistre le nouveau mot de passe (lien de réinitialisation ou page Profil). */
export async function updatePassword(
  _prev: FormState<"password" | "confirm">,
  formData: FormData,
): Promise<FormState<"password" | "confirm">> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password") ?? "",
    confirm: formData.get("confirm") ?? "",
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code !== "same_password" && error.code !== "weak_password") {
      logAuthError("updatePassword", error);
    }
    return { error: authErrorMessage(error) };
  }
  return { success: "Mot de passe modifié." };
}
