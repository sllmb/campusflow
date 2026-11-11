import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { Logo } from "@/components/layout/logo";

export const metadata: Metadata = { title: "Hors connexion" };

/**
 * Page affichée par le service worker quand le réseau manque.
 * Mise en cache à l'installation : elle doit fonctionner sans JavaScript ni données.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-[18px] py-10 text-center">
      <Logo href="/dashboard" />
      <div className="mt-12 flex size-16 items-center justify-center rounded-2xl border-2 bg-primary shadow-hard-sm">
        <WifiOff className="size-8" strokeWidth={2.4} aria-hidden />
      </div>
      <h1 className="mt-6 text-3xl font-extrabold tracking-[-0.03em]">Pas de connexion</h1>
      <p className="mt-2 max-w-sm text-[15px] text-ink-soft">
        CampusFlow a besoin d&apos;internet pour afficher tes données. Vérifie ton Wi-Fi ou tes
        données mobiles, puis réessaie.
      </p>
      {/* Simple lien (et non un bouton JavaScript) : fonctionne même si les scripts manquent. */}
      <a
        href="/dashboard"
        className="mt-8 inline-flex h-13 items-center rounded-full border-2 bg-primary px-6 text-base font-bold shadow-hard-sm"
      >
        Réessayer
      </a>
    </main>
  );
}
