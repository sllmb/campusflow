"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "./button";

type ConfirmSubmitProps = ButtonProps & { message: string };

/** Bouton d'envoi qui demande confirmation (suppression, action irréversible). */
export function ConfirmSubmit({ message, children, disabled, ...props }: ConfirmSubmitProps) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
