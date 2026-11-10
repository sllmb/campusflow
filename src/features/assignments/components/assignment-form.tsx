"use client";

import { useActionState } from "react";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/features/auth/components/field";
import { FormShell } from "@/features/subjects/components/form-shell";
import { useCloseOnSuccess } from "@/features/subjects/components/use-close-on-success";
import { saveAssignment } from "../actions";
import { KINDS, PRIORITIES, STATUSES, type AssignmentKind } from "../constants";
import type { Assignment, SubjectOptionGroup } from "../queries";

export type EditableAssignment = Pick<
  Assignment,
  "id" | "kind" | "title" | "subject_id" | "priority" | "status" | "notes"
> & { dueLocal: string };

type AssignmentFormProps = {
  groups: SubjectOptionGroup[];
  /** Échéance proposée pour un nouvel élément (demain 23:59, heure locale). */
  defaultDue: string;
  assignment?: EditableAssignment;
  onDone?: () => void;
};

export function AssignmentForm({ groups, defaultDue, assignment, onDone }: AssignmentFormProps) {
  const [state, action, pending] = useActionState(saveAssignment, {});
  useCloseOnSuccess(state, onDone);
  const v = state.values;
  const e = state.fieldErrors;
  const key = assignment?.id ?? "new";

  return (
    <FormShell
      action={action}
      pending={pending}
      error={state.error}
      submitLabel={assignment ? "Enregistrer" : "Ajouter"}
      onCancel={onDone}
    >
      {assignment && <input type="hidden" name="id" value={assignment.id} />}

      <ChoiceGroup
        name="kind"
        legend="Type"
        options={KINDS.map(({ value, label }) => ({ value, label }))}
        defaultValue={(v?.kind as AssignmentKind) ?? assignment?.kind ?? "homework"}
        error={e?.kind?.[0]}
      />

      <Field
        name="title"
        id={`assignment-title-${key}`}
        label="Titre"
        placeholder="DM de probabilités"
        defaultValue={v?.title ?? assignment?.title}
        errors={e?.title}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor={`assignment-subject-${key}`}>Matière</Label>
          <Select
            id={`assignment-subject-${key}`}
            name="subjectId"
            defaultValue={v?.subjectId ?? assignment?.subject_id ?? ""}
            aria-invalid={e?.subjectId ? true : undefined}
          >
            <option value="" disabled>
              Choisis une matière
            </option>
            {groups.map((group) => (
              <optgroup key={group.semesterId} label={group.label}>
                {group.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
          {e?.subjectId && <p className="text-[13px] font-semibold text-error">{e.subjectId[0]}</p>}
        </div>
        <Field
          name="dueAt"
          id={`assignment-due-${key}`}
          label="Échéance"
          type="datetime-local"
          defaultValue={v?.dueAt ?? assignment?.dueLocal ?? defaultDue}
          errors={e?.dueAt}
        />
      </div>

      <ChoiceGroup
        name="priority"
        legend="Priorité"
        options={PRIORITIES}
        defaultValue={
          (v?.priority as "low" | "normal" | "high") ?? assignment?.priority ?? "normal"
        }
      />

      {assignment && (
        <ChoiceGroup
          name="status"
          legend="Statut"
          options={STATUSES}
          defaultValue={(v?.status as "todo" | "in_progress" | "done") ?? assignment.status}
        />
      )}

      <div className="grid gap-1.5">
        <Label htmlFor={`assignment-notes-${key}`}>Notes (facultatif)</Label>
        <Textarea
          id={`assignment-notes-${key}`}
          name="notes"
          placeholder="Exercices 3 à 7, rendre sur Moodle…"
          defaultValue={v?.notes ?? assignment?.notes ?? ""}
          aria-invalid={e?.notes ? true : undefined}
        />
        {e?.notes && <p className="text-[13px] font-semibold text-error">{e.notes[0]}</p>}
      </div>
    </FormShell>
  );
}
