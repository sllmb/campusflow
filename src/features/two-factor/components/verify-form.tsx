"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/features/auth/components/form-alert";
import { verifyTwoFactorLogin } from "../actions";
import { CodeField } from "./code-field";

export function VerifyForm() {
  const [state, action, pending] = useActionState(verifyTwoFactorLogin, {});
  return (
    <form action={action} className="grid gap-4" noValidate>
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      <CodeField errors={state.fieldErrors?.code} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Vérification…" : "Vérifier"}
      </Button>
    </form>
  );
}
