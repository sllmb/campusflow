"use server";

import { revalidatePath } from "next/cache";
import { isStaleUnconfirmed } from "./lib/adoption";
import { deleteStaleAccounts } from "./queries";

export type CleanupResult = { message?: string; error?: string };

/** Supprime les comptes jamais confirmés depuis plus de 7 jours (robots, adresses erronées). */
export async function cleanUpStaleAccounts(): Promise<CleanupResult> {
  try {
    const now = new Date();
    const deleted = await deleteStaleAccounts((account) => isStaleUnconfirmed(account, now));
    revalidatePath("/admin");
    return {
      message:
        deleted === 0
          ? "Aucun compte à supprimer."
          : `${deleted} compte${deleted > 1 ? "s" : ""} non confirmé${deleted > 1 ? "s" : ""} supprimé${deleted > 1 ? "s" : ""}.`,
    };
  } catch {
    return { error: "Suppression impossible. Réessaie, ou vérifie ton code 2FA." };
  }
}
