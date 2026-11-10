"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/features/auth/components/form-alert";

type FormShellProps = {
  action: (formData: FormData) => void;
  pending: boolean;
  error?: string;
  submitLabel: string;
  onCancel?: () => void;
  children: ReactNode;
};

/** Cadre commun des petits formulaires (erreur, champs, Enregistrer / Annuler). */
export function FormShell({
  action,
  pending,
  error,
  submitLabel,
  onCancel,
  children,
}: FormShellProps) {
  return (
    <form action={action} className="grid gap-4" noValidate>
      {error && <FormAlert tone="error">{error}</FormAlert>}
      {children}
      <div className="flex flex-wrap gap-2.5">
        <Button type="submit" variant="dark" disabled={pending}>
          {pending ? "Enregistrement…" : submitLabel}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={pending}>
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
}
