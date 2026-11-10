"use client";

import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { IconAction } from "./icon-action";

function DeleteButton({
  label,
  message,
  withText,
}: {
  label: string;
  message: string;
  withText?: boolean;
}) {
  const { pending } = useFormStatus();
  const confirm = (event: React.MouseEvent) => {
    if (!window.confirm(message)) event.preventDefault();
  };
  if (withText) {
    return (
      <button
        type="submit"
        disabled={pending}
        onClick={confirm}
        className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-bold text-error hover:bg-pink/30 disabled:opacity-50"
      >
        <Trash2 className="size-4" strokeWidth={2.4} aria-hidden />
        {pending ? "Suppression…" : label}
      </button>
    );
  }
  return (
    <IconAction type="submit" aria-label={label} disabled={pending} onClick={confirm}>
      <Trash2 strokeWidth={2.2} />
    </IconAction>
  );
}

type DeleteFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  label: string;
  message: string;
  /** Affiche le libellé à côté de la corbeille (au lieu d'une icône seule). */
  withText?: boolean;
};

/** Bouton corbeille qui envoie une suppression après confirmation. */
export function DeleteForm({ action, id, label, message, withText }: DeleteFormProps) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <DeleteButton label={label} message={message} withText={withText} />
    </form>
  );
}
