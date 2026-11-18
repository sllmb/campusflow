"use client";

import { useActionState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormAlert } from "@/features/auth/components/form-alert";
import { cn } from "@/lib/utils";
import { submitFormResponse, type SubmitState } from "../actions";
import { LIMITS, type Question } from "../lib/forms";

const choice =
  "flex cursor-pointer items-center gap-3 rounded-2xl border-2 bg-background px-4 py-3 text-[15px] font-semibold has-checked:bg-primary";

function QuestionField({ question, error }: { question: Question; error?: string }) {
  const name = `q-${question.id}`;
  const errorId = `${name}-error`;
  const described = error ? errorId : undefined;
  const legend = (
    <legend className="text-[15px] font-bold">
      {question.label}
      {question.required && (
        <span className="text-error" aria-hidden>
          {" "}
          *
        </span>
      )}
      {question.required && <span className="sr-only"> (obligatoire)</span>}
    </legend>
  );

  let control;
  switch (question.kind) {
    case "short_text":
      control = (
        <Input
          name={name}
          aria-label={question.label}
          aria-describedby={described}
          aria-invalid={error ? true : undefined}
          maxLength={LIMITS.shortText}
        />
      );
      break;
    case "long_text":
      control = (
        <Textarea
          name={name}
          aria-label={question.label}
          aria-describedby={described}
          aria-invalid={error ? true : undefined}
          maxLength={LIMITS.longText}
        />
      );
      break;
    case "single_choice":
    case "multiple_choice":
      control = (
        <div className="grid gap-2">
          {question.options.map((option) => (
            <label key={option} className={choice}>
              <input
                type={question.kind === "single_choice" ? "radio" : "checkbox"}
                name={name}
                value={option}
                className="size-5 accent-ink"
              />
              {option}
            </label>
          ))}
        </div>
      );
      break;
    case "scale":
      control = (
        <div>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <label key={value} className={cn(choice, "justify-center px-0")}>
                <input type="radio" name={name} value={value} className="sr-only" />
                <span className="text-lg font-extrabold">{value}</span>
              </label>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[12px] text-ink-soft">
            <span>1 = pas du tout</span>
            <span>5 = tout à fait</span>
          </div>
        </div>
      );
      break;
  }

  return (
    <fieldset className="grid gap-3" aria-describedby={described}>
      {legend}
      {control}
      {error && (
        <p id={errorId} className="text-[13px] font-semibold text-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function ResponseForm({
  formId,
  questions,
  anonymous,
}: {
  formId: string;
  questions: Question[];
  anonymous: boolean;
}) {
  const [state, action, pending] = useActionState<SubmitState, FormData>(submitFormResponse, {});

  if (state.done) {
    return (
      <Card tone="green" className="max-w-xl">
        <CardTitle>Merci pour tes réponses !</CardTitle>
        <p className="mt-2 text-[15px]">Elles aideront à rendre CampusFlow encore plus utile.</p>
        <ButtonLink href="/dashboard" variant="dark" className="mt-4">
          Retour à l&apos;accueil
        </ButtonLink>
      </Card>
    );
  }

  return (
    <form action={action} className="grid max-w-2xl gap-6" noValidate>
      <input type="hidden" name="formId" value={formId} />
      <p
        className={cn(
          "rounded-2xl border-2 px-4 py-3 text-sm font-semibold",
          anonymous ? "bg-green/30" : "bg-yellow/40",
        )}
      >
        {anonymous
          ? "Questionnaire anonyme : tes réponses ne sont pas reliées à ton compte."
          : "Questionnaire nominatif : ton prénom et ton adresse e-mail accompagnent tes réponses."}
      </p>
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      {questions.map((question) => (
        <Card key={question.id} className="p-5">
          <QuestionField question={question} error={state.errors?.[question.id]} />
        </Card>
      ))}
      <Button
        type="submit"
        variant="dark"
        size="lg"
        disabled={pending}
        className="justify-self-start"
      >
        {pending ? "Envoi…" : "Envoyer mes réponses"}
      </Button>
    </form>
  );
}
