"use client";

import { Ban, RotateCcw, Trash2 } from "lucide-react";
import { useActionState } from "react";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { FormAlert } from "@/features/auth/components/form-alert";
import { manageUserAction, type CleanupResult } from "../actions";

/** Suspendre / réactiver / supprimer un compte, toujours après confirmation. */
export function UserActions({
  id,
  label,
  suspended,
}: {
  id: string;
  /** E-mail du compte, pour la confirmation. */
  label: string;
  suspended: boolean;
}) {
  const [state, action] = useActionState<CleanupResult, FormData>(manageUserAction, {});
  return (
    <div className="grid gap-2">
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      {state.message && <FormAlert tone="success">{state.message}</FormAlert>}
      <div className="flex flex-wrap gap-2">
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="action" value={suspended ? "reactivate" : "suspend"} />
          <ConfirmSubmit
            variant="outline"
            size="sm"
            message={
              suspended
                ? `Réactiver le compte ${label} ?`
                : `Suspendre le compte ${label} ? Il ne pourra plus se connecter (ses données sont gardées).`
            }
          >
            {suspended ? <RotateCcw /> : <Ban />} {suspended ? "Réactiver" : "Suspendre"}
          </ConfirmSubmit>
        </form>
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="action" value="delete" />
          <ConfirmSubmit
            variant="danger"
            size="sm"
            message={`Supprimer DÉFINITIVEMENT le compte ${label} et toutes ses données ? C'est irréversible.`}
          >
            <Trash2 /> Supprimer
          </ConfirmSubmit>
        </form>
      </div>
    </div>
  );
}
