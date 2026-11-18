"use client";

import { Trash2 } from "lucide-react";
import { useActionState } from "react";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { FormAlert } from "@/features/auth/components/form-alert";
import { cleanUpStaleAccounts, type CleanupResult } from "../actions";

export function CleanupButton({ count }: { count: number }) {
  const [state, action] = useActionState<CleanupResult>(cleanUpStaleAccounts, {});
  return (
    <form action={action} className="grid gap-3">
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      {state.message && <FormAlert tone="success">{state.message}</FormAlert>}
      <ConfirmSubmit
        variant="danger"
        size="sm"
        className="justify-self-start"
        disabled={count === 0}
        message={`Supprimer définitivement ${count} compte(s) jamais confirmé(s) depuis plus de 7 jours ?`}
      >
        <Trash2 /> Supprimer ces comptes
      </ConfirmSubmit>
    </form>
  );
}
