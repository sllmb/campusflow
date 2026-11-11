"use client";

import { Download, Share, SquarePlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/layout/logo-mark";
import { Button } from "@/components/ui/button";

const DISMISSED_KEY = "campusflow:install-hint-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
}

function wasDismissed() {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Invite à installer CampusFlow sur l'écran d'accueil.
 * iPhone / iPad : instructions (Safari n'a pas de bouton d'installation).
 * Android / Chrome : bouton « Installer » (événement beforeinstallprompt).
 * Rendu côté navigateur uniquement (voir InstallHintLoader).
 */
export function InstallHint() {
  const [hidden, setHidden] = useState(() => isStandalone() || wasDismissed());
  const [ios] = useState(isIos);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setHidden(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden || (!ios && !deferred)) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Stockage indisponible : la carte reviendra à la prochaine visite.
    }
  };

  return (
    <section
      aria-label="Installer l'application"
      className="mb-5 flex items-start gap-3 rounded-card border-2 bg-surface p-4 shadow-hard"
    >
      <LogoMark className="size-11" />
      <div className="min-w-0 flex-1">
        <p className="font-extrabold">Installe CampusFlow</p>
        {ios ? (
          <p className="mt-1 text-sm text-ink-soft">
            Touche{" "}
            <Share className="inline size-4 align-[-3px]" strokeWidth={2.4} aria-label="Partager" />{" "}
            dans Safari, puis{" "}
            <span className="font-bold text-ink">
              <SquarePlus className="inline size-4 align-[-3px]" strokeWidth={2.4} aria-hidden />{" "}
              Sur l&apos;écran d&apos;accueil
            </span>
            .
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-ink-soft">
              Ouvre-la en un geste, en plein écran, comme une vraie app.
            </p>
            <Button
              size="sm"
              className="mt-3"
              onClick={async () => {
                if (!deferred) return;
                await deferred.prompt();
                const { outcome } = await deferred.userChoice;
                setDeferred(null);
                if (outcome === "accepted") setHidden(true);
              }}
            >
              <Download /> Installer
            </Button>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Masquer"
        className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-muted"
      >
        <X className="size-5" strokeWidth={2.4} />
      </button>
    </section>
  );
}
