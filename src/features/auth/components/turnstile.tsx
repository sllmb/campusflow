"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Vérification anti-robots Cloudflare Turnstile.
 *
 * Affichée seulement si NEXT_PUBLIC_TURNSTILE_SITE_KEY est défini (production) ; sur ton ordi
 * et sur la base de test, rien ne s'affiche. Le jeton obtenu est envoyé avec le formulaire
 * (champ caché « captchaToken ») et vérifié par Supabase lui-même.
 */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      language: string;
      theme: "light";
      size: "flexible";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

/** Charge le script de Cloudflare une seule fois pour tout le site. */
function loadTurnstile() {
  scriptPromise ??= new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile absent"));
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Turnstile indisponible"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/**
 * `resetKey` : à changer après chaque envoi du formulaire (par exemple l'état renvoyé par la
 * Server Action). Un jeton ne sert qu'une fois : le widget en redemande un nouveau.
 */
export function Turnstile({ resetKey }: { resetKey?: unknown }) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  // Le jeton est écrit directement dans le champ caché : il change hors du rendu React.
  const input = useRef<HTMLInputElement>(null);
  const setToken = (value: string) => {
    if (input.current) input.current.value = value;
  };
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!SITE_KEY || !container.current) return;
    let cancelled = false;
    const element = container.current;
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled) return;
        widgetId.current = turnstile.render(element, {
          sitekey: SITE_KEY,
          language: "fr",
          theme: "light",
          size: "flexible",
          callback: (value) => {
            setToken(value);
            setFailed(false);
          },
          "expired-callback": () => setToken(""),
          "error-callback": () => {
            setToken("");
            setFailed(true);
          },
        });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
    };
  }, []);

  // Après un envoi, le jeton a été consommé : on en demande un nouveau.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setToken("");
    if (widgetId.current) window.turnstile?.reset(widgetId.current);
  }, [resetKey]);

  if (!SITE_KEY) return null;

  return (
    <div className="grid gap-1.5">
      <div ref={container} className="min-h-[65px]" />
      <input ref={input} type="hidden" name="captchaToken" defaultValue="" />
      {failed && (
        <p className="text-[13px] font-semibold text-error">
          La vérification anti-robots n&apos;a pas pu se charger. Recharge la page.
        </p>
      )}
    </div>
  );
}
