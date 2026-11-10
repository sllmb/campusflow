"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { authErrorMessage, logAuthError } from "./errors";
import { signInSchema, signUpSchema } from "./schemas";
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
  await supabase.auth.signOut();
  redirect("/login");
}
