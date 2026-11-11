"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { parseDay } from "@/features/assignments/lib/calendar";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { utcToLocalInput } from "@/lib/time";
import { getTimeZone } from "@/lib/timezone";
import { formatMinutes } from "@/features/focus/lib/timer";
import { BLOCK_MINUTES, MAX_MINUTES_PER_DAY, MAX_TOTAL_MINUTES, planRevisions } from "./lib/plan";

export type PlanField = "hours" | "weekdays";

const idSchema = z.uuid();

function revalidate() {
  revalidatePath("/devoirs");
  revalidatePath("/devoirs/calendrier");
  revalidatePath("/dashboard");
}

/** « 10 », « 1,5 », « 2.25 » heures → minutes, ou null. */
function parseHours(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const hours = Number(value.trim().replace(",", "."));
  if (!value.trim() || !Number.isFinite(hours)) return null;
  return Math.round((hours * 60) / BLOCK_MINUTES) * BLOCK_MINUTES;
}

async function localToday() {
  const timeZone = await getTimeZone();
  return { timeZone, today: utcToLocalInput(new Date().toISOString(), timeZone).slice(0, 10) };
}

/**
 * Crée (ou recrée) le planning d'un examen ou d'un projet. Les créneaux déjà faits et ceux des
 * jours passés sont gardés ; les créneaux à venir non faits sont remplacés.
 */
export async function planRevisionsAction(
  _prev: FormState<PlanField>,
  formData: FormData,
): Promise<FormState<PlanField>> {
  const values = {
    hours: String(formData.get("hours") ?? ""),
    weekdays: formData.getAll("weekday").join(","),
  };
  const assignmentId = String(formData.get("assignmentId") ?? "");
  if (!idSchema.safeParse(assignmentId).success) {
    return { error: "Examen introuvable. Recharge la page.", values };
  }

  const minutes = parseHours(formData.get("hours"));
  if (minutes === null || minutes < BLOCK_MINUTES) {
    return { fieldErrors: { hours: ["Indique au moins 0,25 h (15 min)."] }, values };
  }
  if (minutes > MAX_TOTAL_MINUTES) {
    return { fieldErrors: { hours: ["200 h maximum."] }, values };
  }
  const weekdays = formData
    .getAll("weekday")
    .map(Number)
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  if (weekdays.length === 0) {
    return { fieldErrors: { weekdays: ["Choisis au moins un jour."] }, values };
  }

  const supabase = await createClient();
  const { data: assignment, error } = await supabase
    .from("assignments")
    .select("id, kind, status, due_at")
    .eq("id", assignmentId)
    .maybeSingle();
  if (error) return { error: "Impossible de lire l'examen. Réessaie dans un instant.", values };
  if (!assignment || assignment.kind === "homework") {
    return { error: "Examen introuvable. Recharge la page.", values };
  }

  const { timeZone, today } = await localToday();
  const examDay = utcToLocalInput(assignment.due_at, timeZone).slice(0, 10);
  const plan = planRevisions({ today, examDay, totalMinutes: minutes, weekdays });
  if (!plan.ok) {
    return plan.reason === "no-days"
      ? {
          fieldErrors: {
            weekdays: ["Aucun de ces jours n'est disponible avant l'échéance."],
          },
          values,
        }
      : {
          fieldErrors: {
            hours: [
              `Trop pour le temps qui reste : ${formatMinutes(plan.maxMinutes)} au plus (${formatMinutes(MAX_MINUTES_PER_DAY)} par jour).`,
            ],
          },
          values,
        };
  }

  const { error: deleteError } = await supabase
    .from("revision_sessions")
    .delete()
    .eq("assignment_id", assignmentId)
    .eq("done", false)
    .gte("planned_on", today);
  if (deleteError) return { error: "Impossible d'enregistrer. Réessaie dans un instant.", values };

  const { error: insertError } = await supabase.from("revision_sessions").insert(
    plan.slots.map((slot) => ({
      assignment_id: assignmentId,
      planned_on: slot.date,
      minutes: slot.minutes,
    })),
  );
  if (insertError) return { error: "Impossible d'enregistrer. Réessaie dans un instant.", values };

  revalidate();
  const count = plan.slots.length;
  return { success: `Planning prêt : ${count} créneau${count > 1 ? "x" : ""}.` };
}

const slotUpdateSchema = z.object({
  id: z.uuid(),
  plannedOn: z.string().refine((value) => parseDay(value) !== null, "Date invalide."),
  minutes: z.coerce
    .number()
    .int()
    .min(BLOCK_MINUTES)
    .max(MAX_MINUTES_PER_DAY)
    .refine((value) => value % BLOCK_MINUTES === 0, "Par quarts d'heure."),
});

/** Déplace un créneau ou change sa durée. */
export async function updateRevisionSlot(
  _prev: FormState<"plannedOn" | "minutes">,
  formData: FormData,
): Promise<FormState<"plannedOn" | "minutes">> {
  const parsed = slotUpdateSchema.safeParse({
    id: formData.get("id"),
    plannedOn: formData.get("plannedOn"),
    minutes: formData.get("minutes"),
  });
  if (!parsed.success) {
    const errors = z.flattenError(parsed.error).fieldErrors;
    return { fieldErrors: { plannedOn: errors.plannedOn, minutes: errors.minutes } };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("revision_sessions")
    .update({ planned_on: parsed.data.plannedOn, minutes: parsed.data.minutes })
    .eq("id", parsed.data.id)
    .select("id");
  if (error) return { error: "Impossible d'enregistrer. Réessaie dans un instant." };
  if (!data.length) return { error: "Créneau introuvable. Recharge la page." };
  revalidate();
  return { success: "Créneau modifié." };
}

export async function toggleRevisionDone(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !idSchema.safeParse(id).success) return;
  const supabase = await createClient();
  await supabase
    .from("revision_sessions")
    .update({ done: formData.get("done") === "true" })
    .eq("id", id);
  revalidate();
}

export async function deleteRevisionSlot(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !idSchema.safeParse(id).success) return;
  const supabase = await createClient();
  await supabase.from("revision_sessions").delete().eq("id", id);
  revalidate();
}

/** Supprime tout le planning d'un examen (créneaux faits compris). */
export async function deleteRevisionPlan(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !idSchema.safeParse(id).success) return;
  const supabase = await createClient();
  await supabase.from("revision_sessions").delete().eq("assignment_id", id);
  revalidate();
}
