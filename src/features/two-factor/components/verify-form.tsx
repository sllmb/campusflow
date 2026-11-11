"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/features/auth/components/form-alert";
import { verifyTwoFactorLogin } from "../actions";
import { CodeField } from "./code-field";

/** Formulaire du code ; `next` (page demandée avant le code) vient de l'adresse. */
export function VerifyForm() {
  return <VerifyFormView next={useSearchParams().get("next") ?? ""} />;
}

export function VerifyFormView({ next }: { next: string }) {
  const [state, action, pending] = useActionState(verifyTwoFactorLogin, {});
  return (
    <form action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      <CodeField errors={state.fieldErrors?.code} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Vérification…" : "Vérifier"}
      </Button>
    </form>
  );
}
