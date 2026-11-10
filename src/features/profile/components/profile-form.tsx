"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/features/auth/components/field";
import { FormAlert } from "@/features/auth/components/form-alert";
import { updateProfile } from "../actions";

export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, {});

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      {state.success && <FormAlert tone="success">{state.success}</FormAlert>}
      <Field
        name="displayName"
        label="Prénom"
        autoComplete="given-name"
        defaultValue={state.values?.displayName ?? displayName}
        errors={state.fieldErrors?.displayName}
        required
      />
      <Button type="submit" variant="dark" className="justify-self-start" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
