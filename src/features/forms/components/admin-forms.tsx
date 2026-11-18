"use client";

import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/features/auth/components/field";
import { FormAlert } from "@/features/auth/components/form-alert";
import { AddPanel } from "@/features/subjects/components/add-panel";
import { DeleteForm } from "@/features/subjects/components/delete-form";
import { FormShell } from "@/features/subjects/components/form-shell";
import { IconAction } from "@/features/subjects/components/icon-action";
import { useCloseOnSuccess } from "@/features/subjects/components/use-close-on-success";
import {
  createForm,
  deleteQuestion,
  moveQuestion,
  saveQuestion,
  updateFormSettings,
} from "../actions";
import {
  kindHasOptions,
  LIMITS,
  QUESTION_KINDS,
  type Question,
  type QuestionKind,
} from "../lib/forms";

/** Nouveau formulaire : juste un titre, la suite se fait dans l'éditeur. */
export function NewFormPanel() {
  const [state, action, pending] = useActionState(createForm, {});
  return (
    <AddPanel label="Nouveau formulaire">
      {(close) => (
        <FormShell
          action={action}
          pending={pending}
          error={state.error}
          submitLabel="Créer le formulaire"
          onCancel={close}
        >
          <Field
            name="title"
            label="Titre"
            placeholder="Mieux te connaître"
            maxLength={LIMITS.title}
            errors={state.fieldErrors?.title}
          />
        </FormShell>
      )}
    </AddPanel>
  );
}

/** Titre, description et anonymat du formulaire. */
export function FormSettings({
  form,
  locked,
}: {
  form: { id: string; title: string; description: string; anonymous: boolean };
  /** Des réponses existent : l'anonymat ne peut plus changer. */
  locked: boolean;
}) {
  const [state, action, pending] = useActionState(updateFormSettings, {});
  return (
    <FormShell action={action} pending={pending} error={state.error} submitLabel="Enregistrer">
      {state.success && <FormAlert tone="success">{state.success}</FormAlert>}
      <input type="hidden" name="id" value={form.id} />
      <Field
        name="title"
        label="Titre"
        defaultValue={form.title}
        maxLength={LIMITS.title}
        errors={state.fieldErrors?.title}
      />
      <div className="grid gap-1.5">
        <Label htmlFor="form-description">Description (facultatif)</Label>
        <Textarea
          id="form-description"
          name="description"
          defaultValue={form.description}
          maxLength={LIMITS.description}
          placeholder="Pourquoi ce questionnaire, combien de temps il prend…"
        />
      </div>
      <label className="flex items-start gap-3 text-[15px]">
        <input
          type="checkbox"
          name="anonymous"
          defaultChecked={form.anonymous}
          disabled={locked}
          className="mt-1 size-5 accent-ink"
        />
        <span>
          <span className="font-bold">Réponses anonymes</span>
          <span className="block text-[13px] text-ink-soft">
            {locked
              ? "Ne peut plus changer : des étudiants ont déjà répondu."
              : "Coché : tu vois les réponses, jamais qui les a données. Décoché : l'étudiant est prévenu que son nom accompagne ses réponses."}
          </span>
        </span>
      </label>
      {locked && <input type="hidden" name="anonymous" value={form.anonymous ? "on" : ""} />}
    </FormShell>
  );
}

function QuestionForm({
  formId,
  question,
  onDone,
}: {
  formId: string;
  question?: Question;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(saveQuestion, {});
  useCloseOnSuccess(state, onDone);
  const [kind, setKind] = useState<QuestionKind>(question?.kind ?? "short_text");
  const key = question?.id ?? "new";
  return (
    <FormShell
      action={action}
      pending={pending}
      error={state.error}
      submitLabel={question ? "Enregistrer la question" : "Ajouter la question"}
      onCancel={onDone}
    >
      <input type="hidden" name="formId" value={formId} />
      {question && <input type="hidden" name="id" value={question.id} />}
      <Field
        name="label"
        id={`question-label-${key}`}
        label="Question"
        defaultValue={state.values?.label ?? question?.label}
        maxLength={LIMITS.label}
        errors={state.fieldErrors?.label}
      />
      <div className="grid gap-1.5">
        <Label htmlFor={`question-kind-${key}`}>Type de réponse</Label>
        <Select
          id={`question-kind-${key}`}
          name="kind"
          value={kind}
          onChange={(event) => setKind(event.target.value as QuestionKind)}
        >
          {QUESTION_KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </Select>
      </div>
      {kindHasOptions(kind) && (
        <div className="grid gap-1.5">
          <Label htmlFor={`question-options-${key}`}>Choix proposés (un par ligne)</Label>
          <Textarea
            id={`question-options-${key}`}
            name="options"
            defaultValue={state.values?.options ?? question?.options.join("\n")}
            placeholder={"L1\nL2\nL3"}
            aria-invalid={state.fieldErrors?.options ? true : undefined}
          />
          {state.fieldErrors?.options && (
            <p className="text-[13px] font-semibold text-error">{state.fieldErrors.options[0]}</p>
          )}
        </div>
      )}
      <label className="flex items-center gap-3 text-[15px] font-bold">
        <input
          type="checkbox"
          name="required"
          defaultChecked={question?.required ?? false}
          className="size-5 accent-ink"
        />
        Réponse obligatoire
      </label>
    </FormShell>
  );
}

/** Une question dans l'éditeur : résumé, puis modification sur demande. */
export function QuestionItem({
  formId,
  question,
  index,
  total,
  locked,
}: {
  formId: string;
  question: Question;
  index: number;
  total: number;
  locked: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const kind = QUESTION_KINDS.find((k) => k.value === question.kind)!;

  if (editing) {
    return (
      <li className="rounded-3xl border-2 bg-surface p-5">
        <QuestionForm formId={formId} question={question} onDone={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className="grid gap-2 rounded-3xl border-2 bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-sm font-extrabold text-ink-soft tabular-nums">
          {index + 1}.
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold">{question.label}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge>{kind.label}</Badge>
            {question.required && <Badge tone="yellow">Obligatoire</Badge>}
          </div>
          {question.options.length > 0 && (
            <p className="mt-1.5 text-[13px] text-ink-soft">{question.options.join(" · ")}</p>
          )}
        </div>
      </div>
      {!locked && (
        <div className="flex flex-wrap items-center gap-1">
          <form action={moveQuestion}>
            <input type="hidden" name="formId" value={formId} />
            <input type="hidden" name="id" value={question.id} />
            <input type="hidden" name="direction" value="up" />
            <IconAction
              type="submit"
              aria-label={`Monter la question ${index + 1}`}
              disabled={index === 0}
            >
              <ArrowUp strokeWidth={2.2} />
            </IconAction>
          </form>
          <form action={moveQuestion}>
            <input type="hidden" name="formId" value={formId} />
            <input type="hidden" name="id" value={question.id} />
            <input type="hidden" name="direction" value="down" />
            <IconAction
              type="submit"
              aria-label={`Descendre la question ${index + 1}`}
              disabled={index === total - 1}
            >
              <ArrowDown strokeWidth={2.2} />
            </IconAction>
          </form>
          <IconAction
            aria-label={`Modifier la question ${index + 1}`}
            onClick={() => setEditing(true)}
          >
            <Pencil strokeWidth={2.2} />
          </IconAction>
          <DeleteQuestion formId={formId} id={question.id} index={index} />
        </div>
      )}
    </li>
  );
}

function DeleteQuestion({ formId, id, index }: { formId: string; id: string; index: number }) {
  return (
    <form action={deleteQuestion}>
      <input type="hidden" name="formId" value={formId} />
      <input type="hidden" name="id" value={id} />
      <IconAction
        type="submit"
        aria-label={`Supprimer la question ${index + 1}`}
        onClick={(event) => {
          if (!window.confirm(`Supprimer la question ${index + 1} ?`)) event.preventDefault();
        }}
      >
        <Trash2 strokeWidth={2.2} />
      </IconAction>
    </form>
  );
}

export function NewQuestionPanel({ formId }: { formId: string }) {
  return (
    <AddPanel label="Ajouter une question" className="shadow-none">
      {(close) => <QuestionForm formId={formId} onDone={close} />}
    </AddPanel>
  );
}

export { DeleteForm };
