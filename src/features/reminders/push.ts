import "server-only";
import webpush, { WebPushError } from "web-push";
import { VAPID_PUBLIC_KEY, VAPID_SUBJECT } from "./config";
import type { Digest } from "./lib/digest";

/** Variables secrètes des rappels (voir src/lib/server-secrets.ts). */
export { getServerSecrets as getReminderSecrets } from "@/lib/server-secrets";

export type PushTarget = { endpoint: string; p256dh: string; auth: string };

/**
 * Envoie une notification à un appareil.
 * `gone` : l'abonnement n'existe plus (désinstallé, permission retirée) et doit être supprimé.
 */
export async function sendPush(
  target: PushTarget,
  message: Digest,
  vapidPrivateKey: string,
): Promise<"sent" | "gone" | "error"> {
  try {
    await webpush.sendNotification(
      { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
      JSON.stringify(message),
      {
        vapidDetails: {
          subject: VAPID_SUBJECT,
          publicKey: VAPID_PUBLIC_KEY,
          privateKey: vapidPrivateKey,
        },
        // Un rappel du matin n'a plus de sens le soir : abandonné au bout de 12 h.
        TTL: 12 * 3600,
      },
    );
    return "sent";
  } catch (error) {
    if (error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410)) {
      return "gone";
    }
    console.error("Rappel non envoyé :", error instanceof Error ? error.message : error);
    return "error";
  }
}
