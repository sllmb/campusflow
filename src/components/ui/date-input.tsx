"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

const HINTS: Record<string, string> = {
  date: "Choisir une date",
  "datetime-local": "Choisir une date et une heure",
  time: "Choisir une heure",
  month: "Choisir un mois",
};

/**
 * Champ de date avec une indication quand il est vide. Sur iPhone, un champ de date vide
 * n'affiche rien du tout ; ailleurs, le navigateur montre « jj/mm/aaaa ». L'indication remplace
 * les deux tant que le champ est vide et n'a pas le focus, puis le champ natif reprend la main.
 */
export function DateInput({
  type = "date",
  placeholder,
  className,
  onChange,
  ...props
}: ComponentProps<"input">) {
  const ref = useRef<HTMLInputElement>(null);
  const [empty, setEmpty] = useState(!props.value && !props.defaultValue);

  useEffect(() => {
    const input = ref.current;
    if (!input) return;
    setEmpty(!input.value);
    // Après l'envoi, React vide le formulaire sans déclencher « change » : on relit la valeur.
    const form = input.form;
    const onReset = () => requestAnimationFrame(() => setEmpty(!input.value));
    form?.addEventListener("reset", onReset);
    return () => form?.removeEventListener("reset", onReset);
  }, []);

  return (
    <div className="relative min-w-0">
      <input
        ref={ref}
        type={type}
        data-empty={empty || undefined}
        className={cn("peer", className)}
        onChange={(event) => {
          setEmpty(!event.currentTarget.value);
          onChange?.(event);
        }}
        {...props}
      />
      {empty && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-10 left-4 flex items-center overflow-hidden text-base whitespace-nowrap text-ink-soft peer-focus:hidden sm:text-[15px]"
        >
          {placeholder ?? HINTS[type] ?? HINTS.date}
        </span>
      )}
    </div>
  );
}
