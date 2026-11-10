"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { signUp } from "../actions";
import { Field } from "./field";
import { FormAlert } from "./form-alert";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, {});

  if (state.success) {
    return <FormAlert tone="success">{state.success}</FormAlert>;
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      <Field
        name="displayName"
        label="Prénom"
        autoComplete="given-name"
        defaultValue={state.values?.displayName}
        errors={state.fieldErrors?.displayName}
        required
      />
      <Field
        name="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        inputMode="email"
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
        required
      />
      <Field
        name="password"
        label="Mot de passe"
        type="password"
        autoComplete="new-password"
        hint="8 caractères minimum."
        errors={state.fieldErrors?.password}
        required
      />
      <Button type="submit" size="lg" className="mt-2" disabled={pending}>
        {pending ? "Création…" : "Créer mon compte"}
      </Button>
    </form>
  );
}
