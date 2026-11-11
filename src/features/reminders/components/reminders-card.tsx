"use client";

import { Bell, BellOff, Send } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { removeSubscription, saveSubscription, sendTestReminder } from "../actions";
import { VAPID_PUBLIC_KEY } from "../config";

type Status = "loading" | "off" | "on" | "denied" | "install" | "unsupported";

/** Clé VAPID (base64 « url ») → octets, le format attendu par le navigateur. */
function keyBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function isIos() {
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function initialStatus(): Status {
  const supported =
    "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  // Sur iPhone, les notifications web n'existent que dans l'app installée (écran d'accueil).
  if (!supported) return isIos() ? "install" : "unsupported";
  if (Notification.permission === "denied") return "denied";
  return "loading";
}

async function registration() {
  return (
    (await navigator.serviceWorker.getRegistration()) ??
    (await navigator.serviceWorker.register("/sw.js", { scope: "/" }))
  );
}

/** Rendu seulement dans le navigateur (voir RemindersCardLoader) : il lit navigator. */
export function RemindersCard() {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // L'appareil est-il déjà abonné ? (réponse asynchrone du navigateur)
  useEffect(() => {
    if (status !== "loading") return;
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg?.pushManager.getSubscription())
      .then((subscription) => setStatus(subscription ? "on" : "off"))
      .catch(() => setStatus("off"));
  }, [status]);

  const enable = () =>
    startTransition(async () => {
      setMessage(null);
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      try {
        const reg = await registration();
        await navigator.serviceWorker.ready;
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyBytes(VAPID_PUBLIC_KEY),
        });
        const result = await saveSubscription(
          subscription.toJSON(),
          Intl.DateTimeFormat().resolvedOptions().timeZone,
        );
        if (!result.ok) await subscription.unsubscribe();
        setStatus(result.ok ? "on" : "off");
        setMessage(result.message);
      } catch {
        setMessage("Impossible d'activer les rappels sur cet appareil.");
      }
    });

  const disable = () =>
    startTransition(async () => {
      setMessage(null);
      const subscription = await (await registration()).pushManager.getSubscription();
      if (subscription) {
        const result = await removeSubscription(subscription.endpoint);
        await subscription.unsubscribe();
        setMessage(result.message);
      }
      setStatus("off");
    });

  const test = () =>
    startTransition(async () => {
      setMessage(null);
      const subscription = await (await registration()).pushManager.getSubscription();
      const result = subscription
        ? await sendTestReminder(subscription.endpoint)
        : { message: "Active d'abord les rappels sur cet appareil." };
      setMessage(result.message);
    });

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <Bell className="size-5" strokeWidth={2.4} aria-hidden />
          Rappels du matin
        </CardTitle>
        {status === "on" && <Badge tone="green">Activés</Badge>}
      </div>
      <p className="mt-1 text-[15px] text-ink-soft">
        Chaque matin vers 8 h (heure du Sénégal), un résumé sur ce téléphone : échéances du jour,
        révisions, examens du lendemain. Rien n&apos;est envoyé s&apos;il n&apos;y a rien à dire.
      </p>

      <div className="mt-4">
        {status === "loading" && <p className="text-sm text-ink-soft">Vérification…</p>}
        {status === "off" && (
          <Button variant="dark" onClick={enable} disabled={pending}>
            <Bell /> {pending ? "Activation…" : "Activer les rappels"}
          </Button>
        )}
        {status === "on" && (
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={test} disabled={pending}>
              <Send /> Envoyer un essai
            </Button>
            <Button variant="ghost" onClick={disable} disabled={pending}>
              <BellOff /> Désactiver
            </Button>
          </div>
        )}
        {status === "install" && (
          <p className="text-[15px]">
            Sur iPhone, les rappels marchent dans l&apos;app installée : dans Safari, touche{" "}
            <span className="font-bold">Partager</span>, puis{" "}
            <span className="font-bold">Sur l&apos;écran d&apos;accueil</span>. Ouvre ensuite
            CampusFlow depuis son icône et reviens ici.
          </p>
        )}
        {status === "denied" && (
          <p className="text-[15px]">
            Les notifications sont bloquées pour CampusFlow. Autorise-les dans les réglages du
            téléphone (Notifications, puis CampusFlow), puis recharge cette page.
          </p>
        )}
        {status === "unsupported" && (
          <p className="text-[15px]">Ce navigateur ne gère pas les notifications.</p>
        )}
      </div>

      {message && (
        <p
          role="status"
          className="mt-4 rounded-2xl border-2 bg-background px-4 py-2 text-sm font-bold"
        >
          {message}
        </p>
      )}
    </Card>
  );
}
