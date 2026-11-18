"use server";

import { revalidatePath } from "next/cache";
import { isStaleUnconfirmed } from "./lib/adoption";
import { z } from "zod";
import { deleteStaleAccounts, manageUser } from "./queries";

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

const manageSchema = z.object({
  id: z.uuid(),
  action: z.enum(["suspend", "reactivate", "delete"]),
});

/** Suspendre, réactiver ou supprimer un compte depuis la liste des utilisateurs. */
export async function manageUserAction(
  _prev: CleanupResult,
  formData: FormData,
): Promise<CleanupResult> {
  const parsed = manageSchema.safeParse({ id: formData.get("id"), action: formData.get("action") });
  if (!parsed.success) return { error: "Action inconnue." };
  try {
    await manageUser(parsed.data.id, parsed.data.action);
  } catch {
    return { error: "Action impossible sur ce compte." };
  }
  revalidatePath("/admin/utilisateurs");
  revalidatePath("/admin");
  return {
    message: {
      suspend: "Compte suspendu : il ne peut plus se connecter.",
      reactivate: "Compte réactivé.",
      delete: "Compte supprimé avec toutes ses données.",
    }[parsed.data.action],
  };
}
