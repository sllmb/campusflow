"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { DELETE_CONFIRMATION } from "./constants";

/** Supprime définitivement le compte connecté et toutes ses données. */
export async function deleteAccount(
  _prev: FormState<"confirmation">,
  formData: FormData,
): Promise<FormState<"confirmation">> {
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (confirmation !== DELETE_CONFIRMATION) {
    return { fieldErrors: { confirmation: [`Tape ${DELETE_CONFIRMATION} pour confirmer.`] } };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    console.error("[account] suppression échouée", JSON.stringify({ code: error.code }));
    return {
      error:
        error.code === "42501"
          ? "Reconnecte-toi (avec ton code de double authentification si elle est activée), puis réessaie."
          : "La suppression n'a pas pu se faire. Réessaie dans un instant.",
    };
  }

  // Le compte n'existe plus : on efface aussi la session de ce navigateur.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login?compte=supprime");
}
