import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { signOut } from "@/features/auth/actions";
import { Suspense } from "react";
import { VerifyForm, VerifyFormView } from "@/features/two-factor/components/verify-form";

export const metadata: Metadata = { title: "Vérification" };

export default function VerificationPage() {
  return (
    <Card className="p-6 sm:p-8">
      <span className="flex size-12 items-center justify-center rounded-2xl border-2 bg-primary shadow-hard-sm">
        <ShieldCheck className="size-6" strokeWidth={2.4} aria-hidden />
      </span>
      <h1 className="mt-4 text-[32px] leading-tight font-extrabold tracking-[-0.03em]">
        Encore une étape
      </h1>
      <p className="mt-1 mb-6 text-[15px] text-ink-soft">
        Saisis le code à 6 chiffres affiché dans ton application d&apos;authentification.
      </p>
      <Suspense fallback={<VerifyFormView next="" />}>
        <VerifyForm />
      </Suspense>
      <form action={signOut} className="mt-6 text-center">
        <button
          type="submit"
          className="cursor-pointer text-sm font-bold underline underline-offset-4"
        >
          Se déconnecter
        </button>
      </form>
    </Card>
  );
}
