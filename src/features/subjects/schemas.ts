import { z } from "zod";

/** Nombre saisi au clavier français : « 6,5 » est accepté comme « 6.5 ». */
const decimal = (label: string, max: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const normalized = value.trim().replace(",", ".");
      return normalized === "" ? undefined : Number(normalized);
    },
    z
      .number({
        error: (issue) =>
          issue.input === undefined ? `Indique ${label}.` : "Ce n'est pas un nombre valide.",
      })
      .positive("Doit être supérieur à 0.")
      .max(max, `${max} maximum.`),
  );

const isoDate = (label: string) => z.iso.date({ error: `Indique ${label}.` });

export const idSchema = z.uuid();

export const semesterSchema = z
  .object({
    name: z.string().trim().min(1, "Donne un nom au semestre.").max(60, "60 caractères maximum."),
    startsOn: isoDate("la date de début"),
    endsOn: isoDate("la date de fin"),
  })
  .refine((data) => data.endsOn > data.startsOn, {
    path: ["endsOn"],
    message: "La fin doit être après le début.",
  });

export const unitSchema = z.object({
  name: z.string().trim().min(1, "Donne un nom à l'UE.").max(80, "80 caractères maximum."),
  code: z
    .string()
    .trim()
    .max(20, "20 caractères maximum.")
    .transform((value) => value || null),
  ectsCredits: decimal("le nombre de crédits", 60),
});

export const subjectSchema = z.object({
  name: z.string().trim().min(1, "Donne un nom à la matière.").max(80, "80 caractères maximum."),
  color: z.coerce.number().int().min(1).max(8),
  coefficient: decimal("le coefficient", 100),
});

export type SemesterField = "name" | "startsOn" | "endsOn";
export type UnitField = "name" | "code" | "ectsCredits";
export type SubjectField = "name" | "color" | "coefficient";
