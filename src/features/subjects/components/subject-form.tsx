"use client";

import { useActionState } from "react";
import { Field } from "@/features/auth/components/field";
import { cn } from "@/lib/utils";
import { saveSubject } from "../actions";
import { SUBJECT_COLORS } from "../colors";
import type { Subject } from "../queries";
import { FormShell } from "./form-shell";
import { useCloseOnSuccess } from "./use-close-on-success";

type SubjectFormProps = {
  unitId: string;
  subject?: Pick<Subject, "id" | "name" | "color" | "coefficient">;
  /** Couleur proposée pour une nouvelle matière. */
  suggestedColor?: number;
  onDone?: () => void;
};

export function SubjectForm({ unitId, subject, suggestedColor = 1, onDone }: SubjectFormProps) {
  const [state, action, pending] = useActionState(saveSubject, {});
  useCloseOnSuccess(state, onDone);
  const v = state.values;
  const key = subject?.id ?? `new-${unitId}`;
  const selectedColor = Number(v?.color ?? subject?.color ?? suggestedColor);

  return (
    <FormShell
      action={action}
      pending={pending}
      error={state.error}
      submitLabel={subject ? "Enregistrer" : "Ajouter la matière"}
      onCancel={onDone}
    >
      <input type="hidden" name="unitId" value={unitId} />
      {subject && <input type="hidden" name="id" value={subject.id} />}
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <Field
          name="name"
          id={`subject-name-${key}`}
          label="Matière"
          placeholder="Analyse"
          defaultValue={v?.name ?? subject?.name}
          errors={state.fieldErrors?.name}
        />
        <Field
          name="coefficient"
          id={`subject-coef-${key}`}
          label="Coefficient"
          inputMode="decimal"
          placeholder="1"
          defaultValue={
            v?.coefficient ?? (subject ? String(subject.coefficient).replace(".", ",") : "1")
          }
          errors={state.fieldErrors?.coefficient}
        />
      </div>
      <fieldset>
        <legend className="text-sm font-bold">Couleur</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {SUBJECT_COLORS.map((color) => (
            <label key={color.value} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={color.value}
                defaultChecked={color.value === selectedColor}
                className="peer sr-only"
              />
              <span className="sr-only">{color.label}</span>
              <span
                aria-hidden
                className={cn(
                  "block size-10 rounded-xl border-2 transition-shadow peer-checked:shadow-hard-sm peer-checked:ring-3 peer-checked:ring-ink peer-checked:ring-offset-2 peer-checked:ring-offset-surface peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue",
                  color.className,
                )}
              />
            </label>
          ))}
        </div>
      </fieldset>
    </FormShell>
  );
}
