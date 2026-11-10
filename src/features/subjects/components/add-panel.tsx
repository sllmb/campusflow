"use client";

import { Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type AddPanelProps = {
  label: string;
  /** Contenu affiché une fois ouvert ; reçoit la fonction qui referme le panneau. */
  children: (close: () => void) => ReactNode;
  className?: string;
  defaultOpen?: boolean;
};

/** Bouton « + Ajouter … » qui se déplie en formulaire. */
export function AddPanel({ label, children, className, defaultOpen = false }: AddPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (open) {
    return (
      <div className={cn("rounded-3xl border-2 bg-surface p-5", className)}>
        {children(() => setOpen(false))}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "flex w-full cursor-pointer items-center justify-center gap-2 rounded-3xl border-2 border-dashed px-5 py-4 text-[15px] font-bold transition-colors hover:bg-surface",
        className,
      )}
    >
      <Plus className="size-5" strokeWidth={2.4} aria-hidden />
      {label}
    </button>
  );
}
