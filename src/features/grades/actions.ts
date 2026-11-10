"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { gradeSchema, type GradeField } from "./schemas";

const idSchema = z.uuid();

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function revalidate() {
  revalidatePath("/notes");
  revalidatePath("/dashboard");
}

export async function saveGrade(
  _prev: FormState<GradeField>,
  formData: FormData,
): Promise<FormState<GradeField>> {
  const values = {
    title: text(formData, "title"),
    score: text(formData, "score"),
    outOf: text(formData, "outOf") || "20",
    weight: text(formData, "weight") || "1",
    gradedOn: text(formData, "gradedOn"),
  };
  const parsed = gradeSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };

  const row = {
    title: parsed.data.title,
    score: parsed.data.score,
    out_of: parsed.data.outOf,
    weight: parsed.data.weight,
    graded_on: parsed.data.gradedOn,
  };
  const supabase = await createClient();
  const id = text(formData, "id");

  if (idSchema.safeParse(id).success) {
    const { data, error } = await supabase.from("grades").update(row).eq("id", id).select("id");
    if (error) return { error: "Impossible d'enregistrer. Réessaie dans un instant.", values };
    if (!data.length) return { error: "Note introuvable. Recharge la page.", values };
  } else {
    const subjectId = text(formData, "subjectId");
    if (!idSchema.safeParse(subjectId).success) {
      return { error: "Matière introuvable. Recharge la page.", values };
    }
    const { error } = await supabase.from("grades").insert({ ...row, subject_id: subjectId });
    if (error) {
      const message =
        error.code === "23503"
          ? "Cette matière n'existe plus. Recharge la page."
          : "Impossible d'enregistrer. Réessaie dans un instant.";
      return { error: message, values };
    }
  }

  revalidate();
  return { success: "Note enregistrée." };
}

export async function deleteGrade(formData: FormData) {
  const id = text(formData, "id");
  if (!idSchema.safeParse(id).success) return;
  const supabase = await createClient();
  await supabase.from("grades").delete().eq("id", id);
  revalidate();
}

/** Coche ou décoche « UE validée par le jury ». */
export async function setJuryValidated(formData: FormData) {
  const id = text(formData, "id");
  if (!idSchema.safeParse(id).success) return;
  const supabase = await createClient();
  await supabase
    .from("teaching_units")
    .update({ jury_validated: text(formData, "value") === "true" })
    .eq("id", id);
  revalidate();
}
