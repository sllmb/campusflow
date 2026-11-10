"use client";

import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { IconAction } from "./icon-action";

function DeleteButton({ label, message }: { label: string; message: string }) {
  const { pending } = useFormStatus();
  return (
    <IconAction
      type="submit"
      aria-label={label}
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      <Trash2 strokeWidth={2.2} />
    </IconAction>
  );
}

type DeleteFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  label: string;
  message: string;
};

/** Bouton corbeille qui envoie une suppression après confirmation. */
export function DeleteForm({ action, id, label, message }: DeleteFormProps) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <DeleteButton label={label} message={message} />
    </form>
  );
}
