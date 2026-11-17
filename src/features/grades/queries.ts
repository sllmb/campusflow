import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { semesterResult, type SemesterResult } from "./lib/average";

type Tables = Database["public"]["Tables"];
export type Grade = Tables["grades"]["Row"];

export type SubjectWithGrades = {
  id: string;
  name: string;
  color: number;
  coefficient: number;
  grades: Grade[];
};

export type UnitWithGrades = {
  id: string;
  name: string;
  code: string | null;
  ectsCredits: number;
  juryValidated: boolean;
  subjects: SubjectWithGrades[];
};

export type GradesOverview = {
  semesters: { id: string; name: string }[];
  semester: { id: string; name: string } | null;
  units: UnitWithGrades[];
  result: SemesterResult;
};

/**
 * Notes d'un semestre et résultats calculés.
 * Semestre affiché : celui demandé, sinon celui en cours, sinon le plus récent.
 */
export async function getGradesOverview(
  requestedSemesterId: string | undefined,
  today: string,
): Promise<GradesOverview> {
  const supabase = await createClient();
  // Les quatre tables en un seul aller-retour vers la base (en parallèle) : la RLS limite déjà
  // chaque lecture aux lignes de l'étudiant, et le tri par semestre se fait ensuite en mémoire.
  const [semestersResult, unitsResult, subjectsResult, gradesResult] = await Promise.all([
    supabase
      .from("semesters")
      .select("id, name, starts_on, ends_on")
      .order("starts_on", { ascending: false }),
    supabase
      .from("teaching_units")
      .select("id, semester_id, name, code, ects_credits, jury_validated")
      .order("position")
      .order("created_at"),
    supabase
      .from("subjects")
      .select("id, unit_id, name, color, coefficient")
      .order("position")
      .order("created_at"),
    supabase
      .from("grades")
      .select("*")
      .order("graded_on", { ascending: true, nullsFirst: false })
      .order("created_at"),
  ]);
  if (semestersResult.error) throw semestersResult.error;
  if (unitsResult.error) throw unitsResult.error;
  if (subjectsResult.error) throw subjectsResult.error;
  if (gradesResult.error) throw gradesResult.error;
  const semesters = semestersResult.data;

  const semester =
    semesters.find((s) => s.id === requestedSemesterId) ??
    semesters.find((s) => s.starts_on <= today && today <= s.ends_on) ??
    semesters[0] ??
    null;

  const list = semesters.map(({ id, name }) => ({ id, name }));
  if (!semester) {
    return { semesters: list, semester: null, units: [], result: semesterResult([]) };
  }

  const units = unitsResult.data.filter((unit) => unit.semester_id === semester.id);
  const unitIds = new Set(units.map((unit) => unit.id));
  const subjects = subjectsResult.data.filter((subject) => unitIds.has(subject.unit_id));
  const subjectIds = new Set(subjects.map((subject) => subject.id));
  const grades: Grade[] = gradesResult.data.filter((grade) => subjectIds.has(grade.subject_id));

  const shaped: UnitWithGrades[] = units.map((unit) => ({
    id: unit.id,
    name: unit.name,
    code: unit.code,
    ectsCredits: Number(unit.ects_credits),
    juryValidated: unit.jury_validated,
    subjects: subjects
      .filter((subject) => subject.unit_id === unit.id)
      .map((subject) => ({
        id: subject.id,
        name: subject.name,
        color: subject.color,
        coefficient: Number(subject.coefficient),
        grades: grades
          .filter((grade) => grade.subject_id === subject.id)
          .map((grade) => ({
            ...grade,
            score: Number(grade.score),
            out_of: Number(grade.out_of),
            weight: Number(grade.weight),
          })),
      })),
  }));

  const result = semesterResult(
    shaped.map((unit) => ({
      id: unit.id,
      ectsCredits: unit.ectsCredits,
      juryValidated: unit.juryValidated,
      subjects: unit.subjects.map((subject) => ({
        id: subject.id,
        coefficient: subject.coefficient,
        grades: subject.grades.map((grade) => ({
          score: grade.score,
          outOf: grade.out_of,
          weight: grade.weight,
        })),
      })),
    })),
  );

  return {
    semesters: list,
    semester: { id: semester.id, name: semester.name },
    units: shaped,
    result,
  };
}
