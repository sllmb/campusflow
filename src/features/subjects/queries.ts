import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { idSchema } from "./schemas";

type Tables = Database["public"]["Tables"];
export type Semester = Tables["semesters"]["Row"];
export type TeachingUnit = Tables["teaching_units"]["Row"];
export type Subject = Tables["subjects"]["Row"];

export type SemesterSummary = Semester & { unitCount: number; totalCredits: number };
export type UnitWithSubjects = TeachingUnit & { subjects: Subject[] };

/** Semestres de l'utilisateur, du plus récent au plus ancien, avec leur total de crédits. */
export async function listSemesters(): Promise<SemesterSummary[]> {
  const supabase = await createClient();
  const [{ data: semesters, error }, { data: units }] = await Promise.all([
    supabase.from("semesters").select("*").order("starts_on", { ascending: false }),
    supabase.from("teaching_units").select("semester_id, ects_credits"),
  ]);
  if (error) throw error;

  return (semesters ?? []).map((semester) => {
    const own = (units ?? []).filter((unit) => unit.semester_id === semester.id);
    return {
      ...semester,
      unitCount: own.length,
      totalCredits: own.reduce((sum, unit) => sum + Number(unit.ects_credits), 0),
    };
  });
}

/** Un semestre avec ses UE et leurs matières, ou null s'il n'existe pas (ou appartient à un autre compte). */
export async function getSemester(
  semesterId: string,
): Promise<{ semester: Semester; units: UnitWithSubjects[] } | null> {
  if (!idSchema.safeParse(semesterId).success) return null;

  const supabase = await createClient();
  const { data: semester } = await supabase
    .from("semesters")
    .select("*")
    .eq("id", semesterId)
    .maybeSingle();
  if (!semester) return null;

  const { data: units, error } = await supabase
    .from("teaching_units")
    .select("*")
    .eq("semester_id", semesterId)
    .order("position")
    .order("created_at");
  if (error) throw error;

  const unitIds = (units ?? []).map((unit) => unit.id);
  const { data: subjects, error: subjectsError } = unitIds.length
    ? await supabase
        .from("subjects")
        .select("*")
        .in("unit_id", unitIds)
        .order("position")
        .order("created_at")
    : { data: [] as Subject[], error: null };
  if (subjectsError) throw subjectsError;

  return {
    semester,
    units: (units ?? []).map((unit) => ({
      ...unit,
      ects_credits: Number(unit.ects_credits),
      subjects: (subjects ?? [])
        .filter((subject) => subject.unit_id === unit.id)
        .map((subject) => ({ ...subject, coefficient: Number(subject.coefficient) })),
    })),
  };
}
