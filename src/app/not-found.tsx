import type { Metadata } from "next";
import { Logo } from "@/components/layout/logo";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page introuvable" };

/** Adresse inconnue. */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-[18px] py-10 text-center">
      <Logo href="/" />
      <p className="mt-12 text-[96px] leading-none font-extrabold tracking-[-0.05em]">404</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em]">Page introuvable</h1>
      <p className="mt-2 max-w-sm text-[15px] text-ink-soft">
        L&apos;adresse est peut-être mal écrite, ou la page n&apos;existe plus.
      </p>
      <ButtonLink href="/" size="lg" className="mt-8">
        Retour à l&apos;accueil
      </ButtonLink>
    </div>
  );
}
