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

export const resetRequestSchema = z.object({ email });

export const newPasswordSchema = z
  .object({
    password: z.string().min(8, "8 caractères minimum.").max(72, "72 caractères maximum."),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "Les deux mots de passe ne sont pas identiques.",
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
