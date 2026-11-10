import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { AssignmentKind } from "./constants";

type Tables = Database["public"]["Tables"];
export type Assignment = Tables["assignments"]["Row"];

export type SubjectRef = { id: string; name: string; color: number };
export type AssignmentWithSubject = Assignment & { subject: SubjectRef };

/** Groupe d'options pour le sélecteur de matière (un groupe par semestre). */
export type SubjectOptionGroup = {
  semesterId: string;
  label: string;
  options: { id: string; label: string; color: number }[];
};

/**
 * Matières de l'utilisateur, regroupées par semestre : le semestre en cours d'abord,
 * puis les autres du plus récent au plus ancien.
 */
export async function listSubjectOptions(today: string): Promise<SubjectOptionGroup[]> {
  const supabase = await createClient();
  const [semesters, units, subjects] = await Promise.all([
    supabase.from("semesters").select("id, name, starts_on, ends_on").order("starts_on", {
      ascending: false,
    }),
    supabase.from("teaching_units").select("id, semester_id, name, code").order("created_at"),
    supabase.from("subjects").select("id, unit_id, name, color").order("created_at"),
  ]);
  if (semesters.error) throw semesters.error;
  if (units.error) throw units.error;
  if (subjects.error) throw subjects.error;

  const isCurrent = (s: { starts_on: string; ends_on: string }) =>
    s.starts_on <= today && today <= s.ends_on;
  const ordered = [...semesters.data].sort((a, b) => Number(isCurrent(b)) - Number(isCurrent(a)));

  return ordered
    .map((semester) => ({
      semesterId: semester.id,
      label: semester.name,
      options: units.data
        .filter((unit) => unit.semester_id === semester.id)
        .flatMap((unit) =>
          subjects.data
            .filter((subject) => subject.unit_id === unit.id)
            .map((subject) => ({
              id: subject.id,
              label: unit.code ? `${subject.name} (${unit.code})` : subject.name,
              color: subject.color,
            })),
        ),
    }))
    .filter((group) => group.options.length > 0);
}

/** Devoirs de l'utilisateur avec leur matière, triés par échéance. */
export async function listAssignments(kind?: AssignmentKind): Promise<AssignmentWithSubject[]> {
  const supabase = await createClient();
  let query = supabase.from("assignments").select("*").order("due_at");
  if (kind) query = query.eq("kind", kind);
  const [{ data: assignments, error }, { data: subjects, error: subjectsError }] =
    await Promise.all([query, supabase.from("subjects").select("id, name, color")]);
  if (error) throw error;
  if (subjectsError) throw subjectsError;

  const byId = new Map(subjects.map((subject) => [subject.id, subject]));
  return assignments.flatMap((assignment) => {
    const subject = byId.get(assignment.subject_id);
    return subject ? [{ ...assignment, subject }] : [];
  });
}
