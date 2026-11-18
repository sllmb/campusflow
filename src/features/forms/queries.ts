import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { Question } from "./lib/forms";

type Tables = Database["public"]["Tables"];
export type FormRow = Tables["forms"]["Row"];

/** Toutes les lectures passent par la RLS : l'admin voit tout, l'étudiant les formulaires ouverts. */

export async function listFormsWithCounts() {
  const supabase = await createClient();
  const [forms, responses] = await Promise.all([
    supabase.from("forms").select("*").order("created_at", { ascending: false }),
    supabase.from("form_responses").select("form_id"),
  ]);
  if (forms.error) throw forms.error;
  if (responses.error) throw responses.error;
  const counts = new Map<string, number>();
  responses.data.forEach((row) => counts.set(row.form_id, (counts.get(row.form_id) ?? 0) + 1));
  return forms.data.map((form) => ({ ...form, responses: counts.get(form.id) ?? 0 }));
}

export async function getFormWithQuestions(formId: string) {
  const supabase = await createClient();
  const [form, questions, responses] = await Promise.all([
    supabase.from("forms").select("*").eq("id", formId).maybeSingle(),
    supabase.from("form_questions").select("*").eq("form_id", formId).order("position"),
    supabase
      .from("form_responses")
      .select("id", { count: "exact", head: true })
      .eq("form_id", formId),
  ]);
  if (form.error) throw form.error;
  if (questions.error) throw questions.error;
  if (!form.data) return null;
  return {
    form: form.data,
    questions: questions.data as (Question & { position: number })[],
    // Pour un étudiant, la RLS cache les réponses : le compte vaut alors 0.
    responses: responses.count ?? 0,
  };
}

/** Formulaires ouverts auxquels l'étudiant connecté n'a pas encore répondu. */
export async function listPendingForms() {
  const supabase = await createClient();
  const [forms, participations] = await Promise.all([
    supabase.from("forms").select("id, title").eq("status", "open").order("created_at"),
    supabase.from("form_participations").select("form_id"),
  ]);
  if (forms.error) throw forms.error;
  if (participations.error) throw participations.error;
  const answered = new Set(participations.data.map((row) => row.form_id));
  return forms.data.filter((form) => !answered.has(form.id));
}

export async function hasAnswered(formId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("form_participations")
    .select("form_id")
    .eq("form_id", formId)
    .maybeSingle();
  return Boolean(data);
}
