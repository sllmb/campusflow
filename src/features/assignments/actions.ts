"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { localInputToUtc } from "@/lib/time";
import { getTimeZone } from "@/lib/timezone";
import { assignmentSchema, type AssignmentField } from "./schemas";

const idSchema = z.uuid();

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function revalidate() {
  revalidatePath("/devoirs");
  revalidatePath("/dashboard");
}

export async function saveAssignment(
  _prev: FormState<AssignmentField>,
  formData: FormData,
): Promise<FormState<AssignmentField>> {
  const values = {
    kind: text(formData, "kind"),
    title: text(formData, "title"),
    subjectId: text(formData, "subjectId"),
    dueAt: text(formData, "dueAt"),
    priority: text(formData, "priority") || "normal",
    status: text(formData, "status") || "todo",
    notes: text(formData, "notes"),
  };
  const parsed = assignmentSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };

  const timeZone = await getTimeZone();
  const dueAt = localInputToUtc(parsed.data.dueAt, timeZone);
  if (!dueAt) return { fieldErrors: { dueAt: ["Cette date n'existe pas."] }, values };

  const row = {
    kind: parsed.data.kind,
    title: parsed.data.title,
    subject_id: parsed.data.subjectId,
    due_at: dueAt,
    priority: parsed.data.priority,
    status: parsed.data.status,
    notes: parsed.data.notes,
  };

  const supabase = await createClient();
  const rawId = text(formData, "id");
  const id = idSchema.safeParse(rawId).success ? rawId : null;

  const { data, error } = id
    ? await supabase.from("assignments").update(row).eq("id", id).select("id")
    : await supabase.from("assignments").insert(row).select("id");

  if (error) {
    // 23503 : la matière n'existe pas ou appartient à un autre compte.
    const message =
      error.code === "23503"
        ? "Cette matière n'existe plus. Recharge la page."
        : "Impossible d'enregistrer. Réessaie dans un instant.";
    return { error: message, values };
  }
  if (!data.length) return { error: "Élément introuvable. Recharge la page.", values };

  revalidate();
  return { success: id ? "Modifié." : "Ajouté." };
}

/** Coche ou décoche un devoir (terminé / à faire). */
export async function toggleAssignmentDone(formData: FormData) {
  const id = text(formData, "id");
  if (!idSchema.safeParse(id).success) return;
  const done = text(formData, "done") === "true";
  const supabase = await createClient();
  await supabase
    .from("assignments")
    .update({ status: done ? "done" : "todo" })
    .eq("id", id);
  revalidate();
}

export async function deleteAssignment(formData: FormData) {
  const id = text(formData, "id");
  if (!idSchema.safeParse(id).success) return;
  const supabase = await createClient();
  await supabase.from("assignments").delete().eq("id", id);
  revalidate();
}
