"use client";

import { Check, Copy, ExternalLink, ShieldCheck } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { FormAlert } from "@/features/auth/components/form-alert";
import {
  confirmTwoFactorEnrollment,
  disableTwoFactor,
  startTwoFactorEnrollment,
  type Enrollment,
} from "../actions";
import { CodeField } from "./code-field";

type Setup = Extract<Enrollment, { ok: true }>;

function SetupSteps({ setup, onCancel }: { setup: Setup; onCancel: () => void }) {
  const [state, action, pending] = useActionState(confirmTwoFactorEnrollment, {});
  const [copied, setCopied] = useState(false);
  const grouped = setup.secret.match(/.{1,4}/g)?.join(" ") ?? setup.secret;

  return (
    <div className="grid gap-5">
      <ol className="grid gap-4 text-[15px]">
        <li>
          <p className="font-bold">
            1. Ajoute CampusFlow dans ton application d&apos;authentification
          </p>
          <p className="mt-1 text-ink-soft">
            Google Authenticator, Authy, ou l&apos;app Mots de passe de l&apos;iPhone.
          </p>
          <div className="mt-3 flex flex-wrap items-start gap-4">
            {/* Sur ordinateur : scanner le QR code avec le téléphone. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- QR code en data URI fourni par Supabase */}
            <img
              src={setup.qrCode}
              alt="QR code à scanner avec ton application d'authentification"
              width={160}
              height={160}
              className="hidden rounded-2xl border-2 bg-white p-2 sm:block"
            />
            <div className="grid min-w-0 flex-1 gap-3">
              {/* Sur téléphone : ouvrir directement l'application. */}
              <a
                href={setup.uri}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 bg-primary px-5 text-[15px] font-bold shadow-hard-sm sm:hidden"
              >
                <ExternalLink className="size-4" strokeWidth={2.4} aria-hidden />
                Ouvrir mon application
              </a>
              <div>
                <p className="text-sm font-bold">Ou saisis cette clé à la main :</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <code className="min-w-0 flex-1 rounded-xl border-2 bg-background px-3 py-2 font-mono text-sm break-words">
                    {grouped}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Copier la clé"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(setup.secret);
                        setCopied(true);
                      } catch {
                        // Copie refusée par le navigateur : la clé reste lisible à l'écran.
                      }
                    }}
                  >
                    {copied ? <Check /> : <Copy />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </li>
        <li>
          <p className="font-bold">2. Saisis le code affiché par l&apos;application</p>
        </li>
      </ol>

      <form action={action} className="grid gap-4" noValidate>
        <input type="hidden" name="factorId" value={setup.factorId} />
        {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
        <CodeField id="enroll-code" errors={state.fieldErrors?.code} />
        <div className="flex flex-wrap gap-2.5">
          <Button type="submit" variant="dark" disabled={pending}>
            {pending ? "Vérification…" : "Activer"}
          </Button>
          <Button variant="ghost" onClick={onCancel} disabled={pending}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}

function DisableForm({
  action,
  pending,
  error,
}: {
  action: () => void;
  pending: boolean;
  error?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Désactiver la double authentification ? Ton compte ne sera plus protégé que par ton mot de passe.",
          )
        ) {
          event.preventDefault();
        }
      }}
      className="grid gap-3"
    >
      {error && <FormAlert tone="error">{error}</FormAlert>}
      <Button type="submit" variant="outline" className="justify-self-start" disabled={pending}>
        {pending ? "Désactivation…" : "Désactiver"}
      </Button>
    </form>
  );
}

export function TwoFactorCard({ enabled }: { enabled: boolean }) {
  const [setup, setSetup] = useState<Setup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, startTransition] = useTransition();
  const [disableState, disableAction, disabling] = useActionState(disableTwoFactor, {});

  // Le serveur renvoie le nouvel état dans la même réponse que l'action : on annonce le
  // changement en comparant avec l'état précédent (le formulaire, lui, a déjà disparu).
  const [previous, setPrevious] = useState(enabled);
  const [notice, setNotice] = useState<string | null>(null);
  if (previous !== enabled) {
    setPrevious(enabled);
    setSetup(null);
    setNotice(enabled ? "Double authentification activée." : "Double authentification désactivée.");
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5" strokeWidth={2.4} aria-hidden />
          Double authentification
        </CardTitle>
        <Badge tone={enabled ? "green" : "white"}>{enabled ? "Activée" : "Désactivée"}</Badge>
      </div>
      {notice && (
        <div className="mt-3">
          <FormAlert tone="success">{notice}</FormAlert>
        </div>
      )}

      {enabled ? (
        <>
          <p className="mt-2 mb-4 text-[15px] text-ink-soft">
            À chaque connexion, un code de ton application d&apos;authentification t&apos;est
            demandé en plus du mot de passe.
          </p>
          <DisableForm action={disableAction} pending={disabling} error={disableState.error} />
        </>
      ) : setup ? (
        <div className="mt-4">
          <SetupSteps setup={setup} onCancel={() => setSetup(null)} />
        </div>
      ) : (
        <>
          <p className="mt-2 text-[15px] text-ink-soft">
            Protège ton compte même si ton mot de passe est volé : à la connexion, un code à 6
            chiffres de ton application d&apos;authentification te sera demandé.
          </p>
          <p className="mt-2 mb-4 text-[13px] text-ink-soft">
            Garde ton téléphone : sans lui, tu ne pourras plus te connecter.
          </p>
          {error && (
            <div className="mb-3">
              <FormAlert tone="error">{error}</FormAlert>
            </div>
          )}
          <Button
            variant="dark"
            disabled={starting}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                setNotice(null);
                const result = await startTwoFactorEnrollment();
                if (result.ok) setSetup(result);
                else setError(result.error);
              })
            }
          >
            {starting ? "Préparation…" : "Activer la double authentification"}
          </Button>
        </>
      )}
    </Card>
  );
}
