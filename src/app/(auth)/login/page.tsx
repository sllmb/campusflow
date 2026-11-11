import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Connexion" };

const notices: Record<string, string> = {
  lien: "Ce lien n'a pas pu ouvrir ta session. Si ton e-mail est confirmé, connecte-toi ci-dessous.",
};

const successes: Record<string, string> = {
  supprime: "Ton compte et toutes tes données ont été supprimés. À bientôt peut-être !",
};

async function LoginFormWithNotice({ searchParams }: PageProps<"/login">) {
  const { erreur, compte } = await searchParams;
  const notice = typeof erreur === "string" ? notices[erreur] : undefined;
  const success = typeof compte === "string" ? successes[compte] : undefined;
  return <LoginForm notice={notice} success={success} />;
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-[32px] leading-tight font-extrabold tracking-[-0.03em]">Re-salut !</h1>
      <p className="mt-1 mb-6 text-[15px] text-ink-soft">Connecte-toi pour retrouver ta semaine.</p>
      <Suspense fallback={<LoginForm />}>
        <LoginFormWithNotice {...props} />
      </Suspense>
      <p className="mt-4 text-center text-sm">
        <Link href="/mot-de-passe-oublie" className="font-bold underline underline-offset-4">
          Mot de passe oublié ?
        </Link>
      </p>
      <p className="mt-3 text-center text-sm">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="font-bold underline underline-offset-4">
          Inscris-toi
        </Link>
      </p>
    </Card>
  );
}
