"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "./schemas";

type ProfileField = "displayName";

export async function updateProfile(
  _prev: FormState<ProfileField>,
  formData: FormData,
): Promise<FormState<ProfileField>> {
  const values = { displayName: String(formData.get("displayName") ?? "") };
  const parsed = profileSchema.safeParse({ displayName: formData.get("displayName") });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { error: "Ta session a expiré. Reconnecte-toi.", values };

  // La RLS garantit en plus qu'on ne peut modifier que sa propre ligne.
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", data.claims.sub);
  if (error) return { error: "Impossible d'enregistrer. Réessaie dans un instant.", values };

  revalidatePath("/", "layout");
  return { success: "Profil enregistré.", values: { displayName: parsed.data.displayName } };
}
