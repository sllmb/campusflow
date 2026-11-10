"use client";

import { useActionState } from "react";
import { Field } from "@/features/auth/components/field";
import { FormShell } from "@/features/subjects/components/form-shell";
import { useCloseOnSuccess } from "@/features/subjects/components/use-close-on-success";
import { saveGrade } from "../actions";
import type { Grade } from "../queries";

const asInput = (value: number) => String(value).replace(".", ",");

type GradeFormProps = {
  subjectId: string;
  grade?: Grade;
  onDone?: () => void;
};

export function GradeForm({ subjectId, grade, onDone }: GradeFormProps) {
  const [state, action, pending] = useActionState(saveGrade, {});
  useCloseOnSuccess(state, onDone);
  const v = state.values;
  const e = state.fieldErrors;
  const key = grade?.id ?? `new-${subjectId}`;

  return (
    <FormShell
      action={action}
      pending={pending}
      error={state.error}
      submitLabel={grade ? "Enregistrer" : "Ajouter la note"}
      onCancel={onDone}
    >
      <input type="hidden" name="subjectId" value={subjectId} />
      {grade && <input type="hidden" name="id" value={grade.id} />}
      <Field
        name="title"
        id={`grade-title-${key}`}
        label="Épreuve"
        placeholder="Partiel, TD 1, oral…"
        defaultValue={v?.title ?? grade?.title}
        errors={e?.title}
      />
      <div className="grid grid-cols-3 gap-3">
        <Field
          name="score"
          id={`grade-score-${key}`}
          label="Note"
          inputMode="decimal"
          placeholder="14,5"
          defaultValue={v?.score ?? (grade ? asInput(grade.score) : "")}
          errors={e?.score}
        />
        <Field
          name="outOf"
          id={`grade-outof-${key}`}
          label="Sur"
          inputMode="decimal"
          defaultValue={v?.outOf ?? (grade ? asInput(grade.out_of) : "20")}
          errors={e?.outOf}
        />
        <Field
          name="weight"
          id={`grade-weight-${key}`}
          label="Poids"
          inputMode="decimal"
          defaultValue={v?.weight ?? (grade ? asInput(grade.weight) : "1")}
          errors={e?.weight}
        />
      </div>
      <Field
        name="gradedOn"
        id={`grade-date-${key}`}
        label="Date (facultatif)"
        type="date"
        defaultValue={v?.gradedOn ?? grade?.graded_on ?? ""}
        errors={e?.gradedOn}
      />
    </FormShell>
  );
}
