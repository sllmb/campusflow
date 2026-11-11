import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { addDays } from "@/features/assignments/lib/calendar";
import { REMINDER_HOUR } from "@/features/reminders/config";
import { buildDigest, reminderDue } from "@/features/reminders/lib/digest";
import { getReminderSecrets, sendPush } from "@/features/reminders/push";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_TIME_ZONE, isValidTimeZone } from "@/lib/time";

/**
 * Rappel du matin, appelé chaque jour par Vercel Cron (voir vercel.json), qui envoie
 * « Authorization: Bearer <CRON_SECRET> ». Sans ce secret : 401, et rien n'est lu.
 */
function authorized(header: string | null, secret: string) {
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header ?? "");
  // Comparaison à temps constant : la durée de la réponse ne trahit pas le secret.
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function GET(request: Request) {
  const { cronSecret, supabaseSecretKey, vapidPrivateKey } = getReminderSecrets();
  if (!cronSecret || !authorized(request.headers.get("authorization"), cronSecret)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (!supabaseSecretKey || !vapidPrivateKey) {
    return NextResponse.json({ error: "Rappels non configurés." }, { status: 503 });
  }

  const admin = createAdminClient(supabaseSecretKey);
  const { data: subscriptions, error } = await admin.from("push_subscriptions").select("*");
  if (error) {
    // Jamais le message brut : il peut contenir la clé elle-même (en-tête refusé…).
    // Seulement un code, pour diagnostiquer sans rien révéler.
    const code = error.code || (error.message.includes("header") ? "cle_mal_formee" : "inconnu");
    console.error("Rappels : lecture des abonnements impossible, code :", code);
    return NextResponse.json({ error: "Lecture impossible.", code }, { status: 500 });
  }

  const now = new Date();
  const byUser = new Map<string, typeof subscriptions>();
  for (const subscription of subscriptions) {
    byUser.set(subscription.user_id, [...(byUser.get(subscription.user_id) ?? []), subscription]);
  }
  const stats = { users: 0, sent: 0, removed: 0, failed: 0 };

  for (const [userId, devices] of byUser) {
    const timeZone = isValidTimeZone(devices[0].time_zone)
      ? devices[0].time_zone
      : DEFAULT_TIME_ZONE;
    // Pas encore 8 h chez l'étudiant, ou déjà prévenu aujourd'hui : on passe.
    const { today } = reminderDue(now, timeZone, null, REMINDER_HOUR);
    const waiting = devices.filter(
      (device) => reminderDue(now, timeZone, device.last_sent_on, REMINDER_HOUR).due,
    );
    if (waiting.length === 0) continue;
    stats.users += 1;

    const [assignments, revisions] = await Promise.all([
      admin
        .from("assignments")
        .select("title, kind, status, due_at")
        .eq("user_id", userId)
        .neq("status", "done")
        .lt("due_at", `${addDays(today, 3)}T00:00:00Z`),
      admin
        .from("revision_sessions")
        .select("planned_on, minutes, done")
        .eq("user_id", userId)
        .eq("planned_on", today),
    ]);
    if (assignments.error || revisions.error) {
      stats.failed += waiting.length;
      continue;
    }

    const digest = buildDigest({
      today,
      timeZone,
      assignments: assignments.data.map((a) => ({ ...a, dueAt: a.due_at })),
      revisions: revisions.data.map((r) => ({
        plannedOn: r.planned_on,
        minutes: r.minutes,
        done: r.done,
      })),
    });

    for (const device of waiting) {
      const result = digest ? await sendPush(device, digest, vapidPrivateKey) : "sent";
      if (result === "gone") {
        await admin.from("push_subscriptions").delete().eq("id", device.id);
        stats.removed += 1;
      } else if (result === "error") {
        stats.failed += 1;
      } else {
        await admin.from("push_subscriptions").update({ last_sent_on: today }).eq("id", device.id);
        if (digest) stats.sent += 1;
      }
    }
  }

  return NextResponse.json(stats);
}
