import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SignupForm } from "@/features/auth/components/signup-form";

export const metadata: Metadata = { title: "Inscription" };

export default function SignupPage() {
  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-[32px] leading-tight font-extrabold tracking-[-0.03em]">Bienvenue !</h1>
      <p className="mt-1 mb-6 text-[15px] text-ink-soft">
        Crée ton compte : tes données restent privées.
      </p>
      <SignupForm />
      <p className="mt-6 text-center text-sm">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-bold underline underline-offset-4">
          Connecte-toi
        </Link>
      </p>
    </Card>
  );
}
