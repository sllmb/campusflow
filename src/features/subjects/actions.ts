"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import {
  idSchema,
  semesterSchema,
  subjectSchema,
  unitSchema,
  type SemesterField,
  type SubjectField,
  type UnitField,
} from "./schemas";

function dbErrorMessage(error: PostgrestError) {
  // 23514 : une contrainte CHECK a refusé la valeur ; le reste est imprévu.
  return error.code === "23514"
    ? "Une valeur n'est pas acceptée. Vérifie les champs."
    : "Impossible d'enregistrer. Réessaie dans un instant.";
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function optionalId(formData: FormData, key: string) {
  const value = text(formData, key);
  return value && idSchema.safeParse(value).success ? value : null;
}

const NOT_FOUND = "Élément introuvable. Recharge la page.";

// --- Semestres ---------------------------------------------------------------

export async function saveSemester(
  _prev: FormState<SemesterField>,
  formData: FormData,
): Promise<FormState<SemesterField>> {
  const values = {
    name: text(formData, "name"),
    startsOn: text(formData, "startsOn"),
    endsOn: text(formData, "endsOn"),
  };
  const parsed = semesterSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };

  const row = {
    name: parsed.data.name,
    starts_on: parsed.data.startsOn,
    ends_on: parsed.data.endsOn,
  };
  const supabase = await createClient();
  const id = optionalId(formData, "id");

  if (id) {
    const { data, error } = await supabase.from("semesters").update(row).eq("id", id).select("id");
    if (error) return { error: dbErrorMessage(error), values };
    if (!data.length) return { error: NOT_FOUND, values };
    revalidatePath("/matieres", "layout");
    return { success: "Semestre modifié." };
  }

  const { data, error } = await supabase.from("semesters").insert(row).select("id").single();
  if (error) return { error: dbErrorMessage(error), values };
  revalidatePath("/matieres", "layout");
  redirect(`/matieres/${data.id}`);
}

export async function deleteSemester(formData: FormData) {
  const id = optionalId(formData, "id");
  if (id) {
    const supabase = await createClient();
    await supabase.from("semesters").delete().eq("id", id);
  }
  revalidatePath("/matieres", "layout");
  redirect("/matieres");
}

// --- UE -------------------------------------------------------------------------

export async function saveUnit(
  _prev: FormState<UnitField>,
  formData: FormData,
): Promise<FormState<UnitField>> {
  const values = {
    name: text(formData, "name"),
    code: text(formData, "code"),
    ectsCredits: text(formData, "ectsCredits"),
  };
  const parsed = unitSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };

  const row = {
    name: parsed.data.name,
    code: parsed.data.code,
    ects_credits: parsed.data.ectsCredits,
  };
  const supabase = await createClient();
  const id = optionalId(formData, "id");

  if (id) {
    const { data, error } = await supabase
      .from("teaching_units")
      .update(row)
      .eq("id", id)
      .select("id");
    if (error) return { error: dbErrorMessage(error), values };
    if (!data.length) return { error: NOT_FOUND, values };
  } else {
    const semesterId = optionalId(formData, "semesterId");
    if (!semesterId) return { error: NOT_FOUND, values };
    const { error } = await supabase
      .from("teaching_units")
      .insert({ ...row, semester_id: semesterId });
    // 23503 : le semestre n'existe pas ou appartient à un autre compte (clé étrangère composite).
    if (error) return { error: error.code === "23503" ? NOT_FOUND : dbErrorMessage(error), values };
  }

  revalidatePath("/matieres", "layout");
  return { success: id ? "UE modifiée." : "UE ajoutée." };
}

export async function deleteUnit(formData: FormData) {
  const id = optionalId(formData, "id");
  if (id) {
    const supabase = await createClient();
    await supabase.from("teaching_units").delete().eq("id", id);
  }
  revalidatePath("/matieres", "layout");
}

// --- Matières ------------------------------------------------------------------

export async function saveSubject(
  _prev: FormState<SubjectField>,
  formData: FormData,
): Promise<FormState<SubjectField>> {
  const values = {
    name: text(formData, "name"),
    color: text(formData, "color") || "1",
    coefficient: text(formData, "coefficient"),
  };
  const parsed = subjectSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };

  const row = {
    name: parsed.data.name,
    color: parsed.data.color,
    coefficient: parsed.data.coefficient,
  };
  const supabase = await createClient();
  const id = optionalId(formData, "id");

  if (id) {
    const { data, error } = await supabase.from("subjects").update(row).eq("id", id).select("id");
    if (error) return { error: dbErrorMessage(error), values };
    if (!data.length) return { error: NOT_FOUND, values };
  } else {
    const unitId = optionalId(formData, "unitId");
    if (!unitId) return { error: NOT_FOUND, values };
    const { error } = await supabase.from("subjects").insert({ ...row, unit_id: unitId });
    if (error) return { error: error.code === "23503" ? NOT_FOUND : dbErrorMessage(error), values };
  }

  revalidatePath("/matieres", "layout");
  return { success: id ? "Matière modifiée." : "Matière ajoutée." };
}

export async function deleteSubject(formData: FormData) {
  const id = optionalId(formData, "id");
  if (id) {
    const supabase = await createClient();
    await supabase.from("subjects").delete().eq("id", id);
  }
  revalidatePath("/matieres", "layout");
}
