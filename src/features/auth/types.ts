/** État renvoyé par les Server Actions de formulaire (lu avec useActionState). */
export type FormState<Field extends string = string> = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<Field, string[]>>;
  /** Valeurs saisies, renvoyées pour pré-remplir le formulaire (jamais le mot de passe). */
  values?: Partial<Record<Field, string>>;
};
