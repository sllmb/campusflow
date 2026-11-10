"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/** Une session de moins d'une minute n'est pas enregistrée. */
const MIN_SECONDS = 60;

const sessionSchema = z
  .object({
    mode: z.enum(["pomodoro", "deep_work"]),
    plannedMinutes: z.number().int().min(1).max(480),
    subjectId: z.uuid().nullable(),
    startedAt: z.number().int().positive(),
    endedAt: z.number().int().positive(),
    focusedSeconds: z.number().int().min(0),
    completed: z.boolean(),
  })
  .refine((s) => s.endedAt >= s.startedAt, "Fin avant le début.")
  .refine((s) => s.focusedSeconds <= s.plannedMinutes * 60 + 5, "Plus long que prévu.")
  .refine(
    (s) => s.focusedSeconds <= Math.ceil((s.endedAt - s.startedAt) / 1000) + 60,
    "Plus long que la durée réelle.",
  );

export type SaveFocusResult = { saved: boolean; error?: string };

export async function saveFocusSession(input: unknown): Promise<SaveFocusResult> {
  const parsed = sessionSchema.safeParse(input);
  if (!parsed.success) return { saved: false, error: "Session invalide." };
  const s = parsed.data;

  const now = Date.now();
  // Pas de session dans le futur ni vieille de plus d'une journée (minuteur oublié).
  if (s.endedAt > now + 60_000 || s.startedAt < now - 30 * 3_600_000) {
    return { saved: false, error: "Horaires de session incohérents." };
  }
  if (s.focusedSeconds < MIN_SECONDS) return { saved: false };

  const supabase = await createClient();
  const { error } = await supabase.from("focus_sessions").insert({
    mode: s.mode,
    planned_minutes: s.plannedMinutes,
    subject_id: s.subjectId,
    started_at: new Date(s.startedAt).toISOString(),
    ended_at: new Date(s.endedAt).toISOString(),
    focused_seconds: s.focusedSeconds,
    completed: s.completed,
  });
  if (error) return { saved: false, error: "Impossible d'enregistrer la session." };

  revalidatePath("/pomodoro");
  revalidatePath("/dashboard");
  return { saved: true };
}

export async function deleteFocusSession(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !z.uuid().safeParse(id).success) return;
  const supabase = await createClient();
  await supabase.from("focus_sessions").delete().eq("id", id);
  revalidatePath("/pomodoro");
  revalidatePath("/dashboard");
}
