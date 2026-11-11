"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field } from "@/features/auth/components/field";
import { FormAlert } from "@/features/auth/components/form-alert";
import { deleteAccount } from "../actions";
import { DELETE_CONFIRMATION } from "../constants";

export function DeleteAccountCard() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteAccount, {});

  return (
    <Card className="border-error">
      <CardTitle className="text-error">Supprimer mon compte</CardTitle>
      <p className="mt-1 text-[15px] text-ink-soft">
        Ton compte et toutes tes données (matières, devoirs, notes, sessions) seront effacés
        définitivement. Cette action est irréversible.
      </p>

      {open ? (
        <form action={action} className="mt-4 grid gap-4" noValidate>
          {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
          <Field
            name="confirmation"
            label={`Pour confirmer, tape ${DELETE_CONFIRMATION}`}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            errors={state.fieldErrors?.confirmation}
          />
          <div className="flex flex-wrap gap-2.5">
            <Button type="submit" variant="danger" disabled={pending}>
              <Trash2 /> {pending ? "Suppression…" : "Supprimer définitivement"}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" className="mt-4" onClick={() => setOpen(true)}>
          <Trash2 /> Supprimer mon compte
        </Button>
      )}
    </Card>
  );
}
