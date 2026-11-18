"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminAccess } from "@/features/admin/queries";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import {
  canPublish,
  checkAnswers,
  isQuestionKind,
  kindHasOptions,
  LIMITS,
  optionsError,
  parseOptions,
  type Question,
} from "./lib/forms";

const id = z.uuid();
const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

/**
 * Les écritures sont de toute façon refusées par la RLS sans le rôle admin et le code 2FA ;
 * cette vérification donne seulement un message clair.
 */
async function adminOnly() {
  if ((await getAdminAccess()) !== "granted") {
    throw new Error("Réservé à l'administrateur, avec la double authentification.");
  }
}

function revalidateForm(formId?: string) {
  revalidatePath("/admin/formulaires");
  if (formId) revalidatePath(`/admin/formulaires/${formId}`);
  revalidatePath("/dashboard");
}

async function responseCount(formId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("form_responses")
    .select("id", { count: "exact", head: true })
    .eq("form_id", formId);
  return count ?? 0;
}

const LOCKED = "Ce formulaire a déjà des réponses : ses questions ne peuvent plus changer.";

/* ---------- Admin : formulaires ---------- */

export async function createForm(
  _prev: FormState<"title">,
  formData: FormData,
): Promise<FormState<"title">> {
  await adminOnly();
  const title = text(formData, "title").trim();
  if (!title || title.length > LIMITS.title) {
    return { fieldErrors: { title: [`Donne un titre (${LIMITS.title} caractères au plus).`] } };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("forms").insert({ title }).select("id").single();
  if (error) return { error: "Impossible de créer le formulaire. Réessaie." };
  revalidateForm();
  redirect(`/admin/formulaires/${data.id}`);
}

export async function updateFormSettings(
  _prev: FormState<"title" | "description">,
  formData: FormData,
): Promise<FormState<"title" | "description">> {
  await adminOnly();
  const formId = text(formData, "id");
  if (!id.safeParse(formId).success) return { error: "Formulaire introuvable." };
  const title = text(formData, "title").trim();
  const description = text(formData, "description").trim();
  const anonymous = formData.get("anonymous") === "on";
  if (!title || title.length > LIMITS.title) {
    return { fieldErrors: { title: [`Donne un titre (${LIMITS.title} caractères au plus).`] } };
  }
  if (description.length > LIMITS.description) {
    return { fieldErrors: { description: [`${LIMITS.description} caractères au plus.`] } };
  }
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("forms")
    .select("anonymous")
    .eq("id", formId)
    .maybeSingle();
  if (!current) return { error: "Formulaire introuvable." };
  // Changer l'anonymat après des réponses tromperait ceux qui ont déjà répondu.
  if (current.anonymous !== anonymous && (await responseCount(formId)) > 0) {
    return { error: "L'anonymat ne peut plus changer : des étudiants ont déjà répondu." };
  }
  const { error } = await supabase
    .from("forms")
    .update({ title, description, anonymous })
    .eq("id", formId);
  if (error) return { error: "Impossible d'enregistrer. Réessaie." };
  revalidateForm(formId);
  return { success: "Formulaire enregistré." };
}

export async function setFormStatus(formData: FormData) {
  await adminOnly();
  const formId = text(formData, "id");
  const status = z.enum(["draft", "open", "closed"]).safeParse(formData.get("status"));
  if (!id.safeParse(formId).success || !status.success) return;
  const supabase = await createClient();
  if (status.data === "open") {
    const { data: questions } = await supabase
      .from("form_questions")
      .select("id")
      .eq("form_id", formId);
    if (!canPublish(questions ?? [])) return;
  }
  await supabase.from("forms").update({ status: status.data }).eq("id", formId);
  revalidateForm(formId);
}

export async function deleteForm(formData: FormData) {
  await adminOnly();
  const formId = text(formData, "id");
  if (!id.safeParse(formId).success) return;
  const supabase = await createClient();
  await supabase.from("forms").delete().eq("id", formId);
  revalidateForm();
  redirect("/admin/formulaires");
}

/* ---------- Admin : questions ---------- */

type QuestionField = "label" | "options";

export async function saveQuestion(
  _prev: FormState<QuestionField>,
  formData: FormData,
): Promise<FormState<QuestionField>> {
  await adminOnly();
  const formId = text(formData, "formId");
  const questionId = text(formData, "id");
  const kind = formData.get("kind");
  const label = text(formData, "label").trim().replace(/\s+/g, " ");
  const required = formData.get("required") === "on";
  const values = { label, options: text(formData, "options") };
  if (!id.safeParse(formId).success || !isQuestionKind(kind)) {
    return { error: "Question invalide.", values };
  }
  if (!label || label.length > LIMITS.label) {
    return {
      fieldErrors: { label: [`Écris la question (${LIMITS.label} caractères au plus).`] },
      values,
    };
  }
  const options = parseOptions(values.options);
  const problem = optionsError(kind, options);
  if (problem) return { fieldErrors: { options: [problem] }, values };
  if ((await responseCount(formId)) > 0) return { error: LOCKED, values };

  const supabase = await createClient();
  const row = { kind, label, required, options: kindHasOptions(kind) ? options : [] };
  if (id.safeParse(questionId).success) {
    const { error } = await supabase.from("form_questions").update(row).eq("id", questionId);
    if (error) return { error: "Impossible d'enregistrer. Réessaie.", values };
  } else {
    const { data: last } = await supabase
      .from("form_questions")
      .select("position")
      .eq("form_id", formId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabase
      .from("form_questions")
      .insert({ ...row, form_id: formId, position: (last?.position ?? -1) + 1 });
    if (error) return { error: "Impossible d'ajouter la question. Réessaie.", values };
  }
  revalidateForm(formId);
  return { success: "Question enregistrée." };
}

export async function deleteQuestion(formData: FormData) {
  await adminOnly();
  const formId = text(formData, "formId");
  const questionId = text(formData, "id");
  if (!id.safeParse(formId).success || !id.safeParse(questionId).success) return;
  if ((await responseCount(formId)) > 0) return;
  const supabase = await createClient();
  await supabase.from("form_questions").delete().eq("id", questionId);
  revalidateForm(formId);
}

/** Échange la place de la question avec sa voisine (au-dessus ou en dessous). */
export async function moveQuestion(formData: FormData) {
  await adminOnly();
  const formId = text(formData, "formId");
  const questionId = text(formData, "id");
  const direction = formData.get("direction") === "up" ? -1 : 1;
  if (!id.safeParse(formId).success || !id.safeParse(questionId).success) return;
  if ((await responseCount(formId)) > 0) return;
  const supabase = await createClient();
  const { data: questions } = await supabase
    .from("form_questions")
    .select("id, position")
    .eq("form_id", formId)
    .order("position");
  if (!questions) return;
  const index = questions.findIndex((q) => q.id === questionId);
  const neighbor = questions[index + direction];
  if (index < 0 || !neighbor) return;
  // Positions renumérotées 0, 1, 2… pour que l'échange soit toujours net.
  const order = questions.map((q) => q.id);
  [order[index], order[index + direction]] = [order[index + direction], order[index]];
  await Promise.all(
    order.map((qid, position) =>
      supabase.from("form_questions").update({ position }).eq("id", qid),
    ),
  );
  revalidateForm(formId);
}

/* ---------- Étudiant : répondre ---------- */

export type SubmitState = { error?: string; errors?: Record<string, string>; done?: boolean };

export async function submitFormResponse(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const formId = text(formData, "formId");
  if (!id.safeParse(formId).success) return { error: "Questionnaire introuvable." };
  const supabase = await createClient();
  // La RLS ne laisse lire que les questions d'un formulaire ouvert.
  const { data: questions, error } = await supabase
    .from("form_questions")
    .select("id, kind, label, required, options")
    .eq("form_id", formId)
    .order("position");
  if (error || !questions?.length) return { error: "Ce questionnaire est fermé." };

  const result = checkAnswers(questions as Question[], (name) => formData.getAll(name).map(String));
  if (!result.ok) {
    return { error: "Certaines réponses sont à compléter.", errors: result.errors };
  }

  const { error: submitError } = await supabase.rpc("submit_form_response", {
    p_form_id: formId,
    p_answers: result.answers,
  });
  if (submitError) {
    if (submitError.code === "23505") return { error: "Tu as déjà répondu à ce questionnaire." };
    if (submitError.code === "P0002") return { error: "Ce questionnaire est fermé." };
    return { error: "Impossible d'envoyer tes réponses. Réessaie." };
  }
  revalidatePath("/dashboard");
  return { done: true };
}
