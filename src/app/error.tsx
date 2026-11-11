"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { Logo } from "@/components/layout/logo";
import { Button, ButtonLink } from "@/components/ui/button";

/**
 * Erreur inattendue dans une page : message simple, sans aucun détail technique
 * (le détail reste dans les journaux du serveur, identifié par `digest`).
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] erreur", error.digest ?? "");
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-[18px] py-10 text-center">
      <Logo href="/dashboard" />
      <h1 className="mt-12 text-3xl font-extrabold tracking-[-0.03em]">Oups, un souci</h1>
      <p className="mt-2 max-w-sm text-[15px] text-ink-soft">
        Quelque chose s&apos;est mal passé. Réessaie ; si ça continue, reviens dans quelques
        minutes.
      </p>
      {error.digest && <p className="mt-2 text-xs text-ink-soft">Référence : {error.digest}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={reset}>
          <RotateCcw /> Réessayer
        </Button>
        <ButtonLink href="/dashboard" variant="outline" size="lg">
          Accueil
        </ButtonLink>
      </div>
    </main>
  );
}
