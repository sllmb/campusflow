"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { signIn } from "../actions";
import { Field } from "./field";
import { FormAlert } from "./form-alert";

export function LoginForm({ notice, success }: { notice?: string; success?: string }) {
  const [state, formAction, pending] = useActionState(signIn, {});

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      {success && !state.error && <FormAlert tone="success">{success}</FormAlert>}
      {notice && !state.error && <FormAlert tone="error">{notice}</FormAlert>}
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
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
        autoComplete="current-password"
        errors={state.fieldErrors?.password}
        required
      />
      <Button type="submit" size="lg" className="mt-2" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
