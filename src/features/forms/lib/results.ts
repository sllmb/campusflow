/**
 * Résultats des formulaires — fonctions pures : résumé par question et export CSV.
 */
import type { Answer, Question } from "./forms";

export type ResponseInput = {
  submittedAt: string;
  answers: Record<string, Answer>;
  /** Formulaire nominatif seulement. */
  respondent?: { name: string; email: string } | null;
};

export type OptionCount = { option: string; count: number; share: number };

export type QuestionSummary =
  | { kind: "text"; question: Question; answered: number; texts: { text: string; by?: string }[] }
  | { kind: "choice"; question: Question; answered: number; counts: OptionCount[] }
  | {
      kind: "scale";
      question: Question;
      answered: number;
      average: number | null;
      counts: OptionCount[];
    };

/**
 * Un résumé par question. Les parts des choix se calculent sur les personnes qui ont répondu à
 * la question (pour des cases à cocher, la somme peut dépasser 100 %). Une valeur inconnue est
 * ignorée.
 */
export function summarize(questions: Question[], responses: ResponseInput[]): QuestionSummary[] {
  return questions.map((question) => {
    const values = responses
      .map((response) => ({ value: response.answers[question.id], response }))
      .filter(({ value }) => value !== undefined && value !== "");

    if (question.kind === "short_text" || question.kind === "long_text") {
      const texts = values
        .filter(({ value }) => typeof value === "string")
        .sort((a, b) => b.response.submittedAt.localeCompare(a.response.submittedAt))
        .map(({ value, response }) => ({
          text: value as string,
          by: response.respondent?.name || response.respondent?.email || undefined,
        }));
      return { kind: "text", question, answered: texts.length, texts };
    }

    if (question.kind === "scale") {
      const notes = values
        .map(({ value }) => value)
        .filter((value): value is number => Number.isInteger(value) && +value >= 1 && +value <= 5);
      const counts = [1, 2, 3, 4, 5].map((note) => {
        const count = notes.filter((value) => value === note).length;
        return { option: String(note), count, share: notes.length ? count / notes.length : 0 };
      });
      const average = notes.length
        ? Math.round((notes.reduce((sum, value) => sum + value, 0) / notes.length) * 10) / 10
        : null;
      return { kind: "scale", question, answered: notes.length, average, counts };
    }

    // Choix unique ou cases à cocher.
    const chosen = values.map(({ value }) =>
      (Array.isArray(value) ? value : [value]).filter(
        (option): option is string =>
          typeof option === "string" && question.options.includes(option),
      ),
    );
    const answered = chosen.filter((list) => list.length > 0).length;
    const counts = question.options.map((option) => {
      const count = chosen.filter((list) => list.includes(option)).length;
      return { option, count, share: answered ? count / answered : 0 };
    });
    return { kind: "choice", question, answered, counts };
  });
}

/* ---------- Export CSV ---------- */

/**
 * Une cellule CSV sûre : entre guillemets si besoin, et jamais interprétée comme une formule
 * par un tableur (une cellule qui commence par = + - @ pourrait lancer un calcul piégé).
 */
export function csvCell(value: string | number) {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function answerText(value: Answer | undefined) {
  if (value === undefined) return "";
  return Array.isArray(value) ? value.join(", ") : String(value);
}

/**
 * Le CSV des réponses : une ligne par réponse, une colonne par question. Séparateur « ; » et
 * marque UTF-8 au début : Excel en français l'ouvre directement avec les accents.
 */
export function toCsv(
  questions: Question[],
  responses: ResponseInput[],
  options: { nominative: boolean; formatDate: (iso: string) => string },
) {
  const header = [
    "Date",
    ...(options.nominative ? ["Prénom", "E-mail"] : []),
    ...questions.map((question) => question.label),
  ];
  const rows = [...responses]
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
    .map((response) => [
      options.formatDate(response.submittedAt),
      ...(options.nominative
        ? [response.respondent?.name ?? "", response.respondent?.email ?? ""]
        : []),
      ...questions.map((question) => answerText(response.answers[question.id])),
    ]);
  return "﻿" + [header, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n");
}
