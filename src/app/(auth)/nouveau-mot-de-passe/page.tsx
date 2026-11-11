import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { NewPasswordForm } from "@/features/auth/components/new-password-form";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

/** Choix d'un nouveau mot de passe : après le lien reçu par e-mail, ou depuis le profil. */
export default function NewPasswordPage() {
  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-[32px] leading-tight font-extrabold tracking-[-0.03em]">
        Nouveau mot de passe
      </h1>
      <p className="mt-1 mb-6 text-[15px] text-ink-soft">
        Choisis-en un que tu n&apos;utilises nulle part ailleurs.
      </p>
      <NewPasswordForm />
    </Card>
  );
}
