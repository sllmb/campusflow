import { z } from "zod";

/** Nombre saisi au clavier français (« 12,5 ») ; `undefined` si le champ est vide. */
function toNumber(value: unknown) {
  if (typeof value !== "string") return value;
  const normalized = value.trim().replace(",", ".");
  return normalized === "" ? undefined : Number(normalized);
}

const number = (missing: string) =>
  z.number({
    error: (issue) => (issue.input === undefined ? missing : "Ce n'est pas un nombre valide."),
  });

export const gradeSchema = z
  .object({
    title: z.string().trim().min(1, "Donne un nom à l'épreuve.").max(80, "80 caractères maximum."),
    score: z.preprocess(
      toNumber,
      number("Indique la note.").min(0, "La note ne peut pas être négative."),
    ),
    outOf: z.preprocess(
      toNumber,
      number("Indique le barème.").positive("Doit être supérieur à 0.").max(1000, "1000 maximum."),
    ),
    weight: z.preprocess(
      toNumber,
      number("Indique le poids.").positive("Doit être supérieur à 0.").max(100, "100 maximum."),
    ),
    gradedOn: z
      .union([z.literal(""), z.iso.date({ error: "Date invalide." })])
      .transform((value) => value || null),
  })
  .refine((data) => data.score <= data.outOf, {
    path: ["score"],
    message: "La note dépasse le barème.",
  });

export type GradeField = "title" | "score" | "outOf" | "weight" | "gradedOn";
