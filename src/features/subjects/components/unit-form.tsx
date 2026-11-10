"use client";

import { useActionState } from "react";
import { Field } from "@/features/auth/components/field";
import { saveUnit } from "../actions";
import type { TeachingUnit } from "../queries";
import { FormShell } from "./form-shell";
import { useCloseOnSuccess } from "./use-close-on-success";

type UnitFormProps = {
  semesterId: string;
  unit?: Pick<TeachingUnit, "id" | "name" | "code" | "ects_credits">;
  onDone?: () => void;
};

export function UnitForm({ semesterId, unit, onDone }: UnitFormProps) {
  const [state, action, pending] = useActionState(saveUnit, {});
  useCloseOnSuccess(state, onDone);
  const v = state.values;
  const key = unit?.id ?? "new";

  return (
    <FormShell
      action={action}
      pending={pending}
      error={state.error}
      submitLabel={unit ? "Enregistrer" : "Ajouter l'UE"}
      onCancel={onDone}
    >
      <input type="hidden" name="semesterId" value={semesterId} />
      {unit && <input type="hidden" name="id" value={unit.id} />}
      <Field
        name="name"
        id={`unit-name-${key}`}
        label="Nom de l'UE"
        placeholder="Fondamentaux"
        defaultValue={v?.name ?? unit?.name}
        errors={state.fieldErrors?.name}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          name="code"
          id={`unit-code-${key}`}
          label="Code (facultatif)"
          placeholder="UE1"
          defaultValue={v?.code ?? unit?.code ?? ""}
          errors={state.fieldErrors?.code}
        />
        <Field
          name="ectsCredits"
          id={`unit-ects-${key}`}
          label="Crédits ECTS"
          inputMode="decimal"
          placeholder="6"
          defaultValue={v?.ectsCredits ?? (unit ? String(unit.ects_credits).replace(".", ",") : "")}
          errors={state.fieldErrors?.ectsCredits}
        />
      </div>
    </FormShell>
  );
}
