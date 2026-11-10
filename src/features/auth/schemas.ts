import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, "Indique ton adresse e-mail.")
  .pipe(z.email("Cette adresse e-mail n'est pas valide."));

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Indique ton mot de passe."),
});

export const signUpSchema = z.object({
  displayName: z.string().trim().min(1, "Indique ton prénom.").max(50, "50 caractères maximum."),
  email,
  password: z.string().min(8, "8 caractères minimum.").max(72, "72 caractères maximum."),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
