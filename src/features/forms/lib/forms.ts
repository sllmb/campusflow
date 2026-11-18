/**
 * Formulaires — fonctions pures : types de questions, choix proposés, vérification des réponses.
 */

export const QUESTION_KINDS = [
  { value: "short_text", label: "Réponse courte", hasOptions: false },
  { value: "long_text", label: "Paragraphe", hasOptions: false },
  { value: "single_choice", label: "Choix unique", hasOptions: true },
  { value: "multiple_choice", label: "Cases à cocher", hasOptions: true },
  { value: "scale", label: "Échelle de 1 à 5", hasOptions: false },
] as const;

export type QuestionKind = (typeof QUESTION_KINDS)[number]["value"];

export const FORM_STATUSES = {
  draft: { label: "Brouillon", tone: "white" },
  open: { label: "Ouvert", tone: "green" },
  closed: { label: "Fermé", tone: "pink" },
} as const;

export type FormStatus = keyof typeof FORM_STATUSES;

export const LIMITS = {
  title: 120,
  description: 1000,
  label: 300,
  options: 20,
  option: 100,
  shortText: 300,
  longText: 3000,
} as const;

export type Question = {
  id: string;
  kind: QuestionKind;
  label: string;
  required: boolean;
  options: string[];
};

export function isQuestionKind(value: unknown): value is QuestionKind {
  return QUESTION_KINDS.some((kind) => kind.value === value);
}

export function kindHasOptions(kind: QuestionKind) {
  return QUESTION_KINDS.find((k) => k.value === kind)!.hasOptions;
}

/** « Choix » saisis un par ligne → liste propre : sans lignes vides ni doublons. */
export function parseOptions(text: string) {
  const options: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const option = line.trim().replace(/\s+/g, " ");
    if (option && !options.includes(option)) options.push(option);
  }
  return options;
}

/** Erreur dans les choix d'une question, ou null s'ils conviennent. */
export function optionsError(kind: QuestionKind, options: string[]) {
  if (!kindHasOptions(kind)) return null;
  if (options.length < 2) return "Propose au moins 2 choix.";
  if (options.length > LIMITS.options) return `${LIMITS.options} choix au plus.`;
  if (options.some((option) => option.length > LIMITS.option)) {
    return `${LIMITS.option} caractères au plus par choix.`;
  }
  return null;
}

/** Un formulaire ne peut être ouvert qu'avec au moins une question. */
export function canPublish(questions: unknown[]) {
  return questions.length > 0;
}

export type Answer = string | string[] | number;
export type AnswersCheck =
  { ok: true; answers: Record<string, Answer> } | { ok: false; errors: Record<string, string> };

/**
 * Vérifie les réponses envoyées (`read(nom)` : toutes les valeurs d'un champ du formulaire,
 * nommé « q-<id de question> ») d'après les questions. Seules les questions connues sont gardées.
 */
export function checkAnswers(
  questions: Question[],
  read: (name: string) => string[],
): AnswersCheck {
  const answers: Record<string, Answer> = {};
  const errors: Record<string, string> = {};

  for (const question of questions) {
    const values = read(`q-${question.id}`)
      .map((value) => value.trim())
      .filter(Boolean);
    const missing = values.length === 0;
    if (missing) {
      if (question.required) errors[question.id] = "Réponse obligatoire.";
      continue;
    }

    switch (question.kind) {
      case "short_text":
      case "long_text": {
        const max = question.kind === "short_text" ? LIMITS.shortText : LIMITS.longText;
        if (values[0].length > max) errors[question.id] = `${max} caractères au plus.`;
        else answers[question.id] = values[0];
        break;
      }
      case "single_choice":
        if (!question.options.includes(values[0])) errors[question.id] = "Choix inconnu.";
        else answers[question.id] = values[0];
        break;
      case "multiple_choice": {
        const chosen = [...new Set(values)];
        if (chosen.some((value) => !question.options.includes(value))) {
          errors[question.id] = "Choix inconnu.";
        } else {
          // Dans l'ordre des choix proposés.
          answers[question.id] = question.options.filter((option) => chosen.includes(option));
        }
        break;
      }
      case "scale": {
        const value = Number(values[0]);
        if (!Number.isInteger(value) || value < 1 || value > 5) {
          errors[question.id] = "Choisis une note de 1 à 5.";
        } else {
          answers[question.id] = value;
        }
        break;
      }
    }
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, answers };
}
