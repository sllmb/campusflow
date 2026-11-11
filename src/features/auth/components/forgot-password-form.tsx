"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "../actions";
import { Field } from "./field";
import { FormAlert } from "./form-alert";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, {});

  if (state.success) return <FormAlert tone="success">{state.success}</FormAlert>;

  return (
    <form action={action} className="grid gap-4" noValidate>
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      <Field
        name="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        inputMode="email"
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
      />
      <Button type="submit" size="lg" className="mt-2" disabled={pending}>
        {pending ? "Envoi…" : "Recevoir le lien"}
      </Button>
    </form>
  );
}
