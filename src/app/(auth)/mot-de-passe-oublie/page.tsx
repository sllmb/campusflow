import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-[32px] leading-tight font-extrabold tracking-[-0.03em]">
        Mot de passe oublié ?
      </h1>
      <p className="mt-1 mb-6 text-[15px] text-ink-soft">
        Indique ton e-mail : on t&apos;envoie un lien pour en choisir un nouveau.
      </p>
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-bold underline underline-offset-4">
          Retour à la connexion
        </Link>
      </p>
    </Card>
  );
}
