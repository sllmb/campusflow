import { Field } from "@/features/auth/components/field";

/** Champ « code à 6 chiffres », avec le remplissage automatique de l'iPhone (SMS / app). */
export function CodeField({ errors, id = "code" }: { errors?: string[]; id?: string }) {
  return (
    <Field
      name="code"
      id={id}
      label="Code à 6 chiffres"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9 ]*"
      maxLength={7}
      placeholder="123 456"
      className="text-center text-2xl font-extrabold tracking-[0.3em] tabular-nums"
      errors={errors}
    />
  );
}
