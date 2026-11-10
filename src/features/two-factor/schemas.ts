import { z } from "zod";

/** Code à 6 chiffres d'une application d'authentification (espaces tolérés). */
export const totpCodeSchema = z
  .string()
  .transform((value) => value.replace(/\s/g, ""))
  .pipe(z.string().regex(/^\d{6}$/, "Le code contient 6 chiffres."));
