"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TIME_ZONE, isValidTimeZone } from "@/lib/time";
import { getReminderSecrets, sendPush } from "./push";

export type ReminderResult = { ok: boolean; message: string };

const subscriptionSchema = z.object({
  endpoint: z.url().startsWith("https://").max(1000),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});

/** Enregistre l'abonnement de cet appareil (fourni par le navigateur). */
export async function saveSubscription(
  subscription: unknown,
  timeZone: string,
): Promise<ReminderResult> {
  const parsed = subscriptionSchema.safeParse(subscription);
  if (!parsed.success) return { ok: false, message: "Abonnement invalide. Réessaie." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_push_subscription", {
    p_endpoint: parsed.data.endpoint,
    p_p256dh: parsed.data.keys.p256dh,
    p_auth: parsed.data.keys.auth,
    p_time_zone: isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIME_ZONE,
  });
  if (error) return { ok: false, message: "Impossible d'activer les rappels. Réessaie." };
  return { ok: true, message: "Rappels activés : tu recevras un résumé chaque matin." };
}

/** Retire l'abonnement de cet appareil. */
export async function removeSubscription(endpoint: string): Promise<ReminderResult> {
  if (!z.url().safeParse(endpoint).success) return { ok: false, message: "Abonnement inconnu." };
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) return { ok: false, message: "Impossible de désactiver. Réessaie." };
  return { ok: true, message: "Rappels désactivés sur cet appareil." };
}

/** Envoie tout de suite une notification d'essai à cet appareil. */
export async function sendTestReminder(endpoint: string): Promise<ReminderResult> {
  const { vapidPrivateKey } = getReminderSecrets();
  if (!vapidPrivateKey) return { ok: false, message: "Les rappels ne sont pas encore configurés." };
  const supabase = await createClient();
  // RLS : on ne lit que ses propres abonnements.
  const { data } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("endpoint", endpoint)
    .maybeSingle();
  if (!data) return { ok: false, message: "Active d'abord les rappels sur cet appareil." };
  const result = await sendPush(
    data,
    {
      title: "CampusFlow",
      body: "Les rappels fonctionnent. Ton résumé arrivera chaque matin.",
      url: "/profil",
    },
    vapidPrivateKey,
  );
  return result === "sent"
    ? { ok: true, message: "Notification d'essai envoyée." }
    : { ok: false, message: "La notification n'est pas partie. Désactive puis réactive." };
}
