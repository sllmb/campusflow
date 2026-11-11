"use client";

import { ArrowRight } from "lucide-react";
import { useActionState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { updatePassword } from "../actions";
import { Field } from "./field";
import { FormAlert } from "./form-alert";

export function NewPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, {});

  if (state.success) {
    return (
      <div className="grid gap-4">
        <FormAlert tone="success">{state.success}</FormAlert>
        <ButtonLink href="/dashboard" size="lg">
          Continuer <ArrowRight />
        </ButtonLink>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-4" noValidate>
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      <Field
        name="password"
        label="Nouveau mot de passe"
        type="password"
        autoComplete="new-password"
        hint="8 caractères minimum."
        errors={state.fieldErrors?.password}
      />
      <Field
        name="confirm"
        label="Confirme le mot de passe"
        type="password"
        autoComplete="new-password"
        errors={state.fieldErrors?.confirm}
      />
      <Button type="submit" size="lg" className="mt-2" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
