"use client";

import { useActionState } from "react";
import { Field } from "@/features/auth/components/field";
import { saveSemester } from "../actions";
import type { Semester } from "../queries";
import { FormShell } from "./form-shell";
import { useCloseOnSuccess } from "./use-close-on-success";

type SemesterFormProps = {
  semester?: Pick<Semester, "id" | "name" | "starts_on" | "ends_on">;
  onDone?: () => void;
};

export function SemesterForm({ semester, onDone }: SemesterFormProps) {
  const [state, action, pending] = useActionState(saveSemester, {});
  useCloseOnSuccess(state, onDone);
  const v = state.values;

  return (
    <FormShell
      action={action}
      pending={pending}
      error={state.error}
      submitLabel={semester ? "Enregistrer" : "Créer le semestre"}
      onCancel={onDone}
    >
      {semester && <input type="hidden" name="id" value={semester.id} />}
      <Field
        name="name"
        id={`semester-name-${semester?.id ?? "new"}`}
        label="Nom"
        placeholder="Semestre 1"
        defaultValue={v?.name ?? semester?.name}
        errors={state.fieldErrors?.name}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          name="startsOn"
          id={`semester-start-${semester?.id ?? "new"}`}
          label="Début"
          type="date"
          defaultValue={v?.startsOn ?? semester?.starts_on}
          errors={state.fieldErrors?.startsOn}
        />
        <Field
          name="endsOn"
          id={`semester-end-${semester?.id ?? "new"}`}
          label="Fin"
          type="date"
          defaultValue={v?.endsOn ?? semester?.ends_on}
          errors={state.fieldErrors?.endsOn}
        />
      </div>
    </FormShell>
  );
}
