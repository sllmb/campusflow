import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { getRespondents } from "@/features/admin/queries";
import type { Answer, Question } from "./lib/forms";
import type { ResponseInput } from "./lib/results";

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

/**
 * Tout ce qu'il faut pour les résultats (admin seulement : la RLS cache les réponses aux autres).
 * Pour un formulaire nominatif, on ajoute le prénom et l'e-mail de chaque personne.
 */
export async function getFormResults(formId: string) {
  const data = await getFormWithQuestions(formId);
  if (!data) return null;
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("form_responses")
    .select("user_id, answers, submitted_at")
    .eq("form_id", formId)
    .order("submitted_at");
  if (error) throw error;

  const respondents =
    !data.form.anonymous && rows.some((row) => row.user_id)
      ? await getRespondents(rows.flatMap((row) => (row.user_id ? [row.user_id] : [])))
      : new Map<string, { name: string; email: string }>();

  const responses: ResponseInput[] = rows.map((row) => ({
    submittedAt: row.submitted_at,
    answers: row.answers as Record<string, Answer>,
    respondent: row.user_id ? (respondents.get(row.user_id) ?? null) : null,
  }));
  return { ...data, responses };
}
