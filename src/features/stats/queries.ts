import "server-only";
import { addDays } from "@/features/assignments/lib/calendar";
import { getGradesOverview } from "@/features/grades/queries";
import { createClient } from "@/lib/supabase/server";
import { localInputToUtc } from "@/lib/time";
import { localDay, type AssignmentInput, type DatedUnit, type SessionInput } from "./lib/stats";

/** Jours d'historique lus pour les sessions : assez pour 2 × 30 jours et une longue série. */
export const HISTORY_DAYS = 90;

export type StatsData = {
  /** Sessions des HISTORY_DAYS derniers jours. */
  sessions: SessionInput[];
  assignments: AssignmentInput[];
  semesterName: string | null;
  units: DatedUnit[];
};

export async function getStatsData(today: string, timeZone: string): Promise<StatsData> {
  const first = addDays(today, -(HISTORY_DAYS - 1));
  // Début du premier jour dans le fuseau de l'étudiant (un jour de marge si l'heure n'existe pas).
  const from = localInputToUtc(`${first}T00:00`, timeZone) ?? `${addDays(first, -1)}T00:00:00Z`;

  const supabase = await createClient();
  const [sessions, subjects, assignments, overview] = await Promise.all([
    supabase
      .from("focus_sessions")
      .select("started_at, focused_seconds, subject_id")
      .gte("started_at", from)
      .order("started_at"),
    supabase.from("subjects").select("id, name, color"),
    supabase.from("assignments").select("due_at, completed_at, status"),
    getGradesOverview(undefined, today),
  ]);
  if (sessions.error) throw sessions.error;
  if (subjects.error) throw subjects.error;
  if (assignments.error) throw assignments.error;

  const byId = new Map(subjects.data.map((subject) => [subject.id, subject]));

  return {
    sessions: sessions.data.map((session) => {
      const subject = session.subject_id ? byId.get(session.subject_id) : undefined;
      return {
        startedAt: session.started_at,
        focusedSeconds: session.focused_seconds,
        subject: subject ? { id: subject.id, name: subject.name, color: subject.color } : null,
      };
    }),
    assignments: assignments.data.map((a) => ({
      dueAt: a.due_at,
      completedAt: a.completed_at,
      status: a.status,
    })),
    semesterName: overview.semester?.name ?? null,
    units: overview.units.map((unit) => ({
      id: unit.id,
      ectsCredits: unit.ectsCredits,
      juryValidated: unit.juryValidated,
      subjects: unit.subjects.map((subject) => ({
        id: subject.id,
        coefficient: subject.coefficient,
        grades: subject.grades.map((grade) => ({
          // Date de l'épreuve, sinon le jour où la note a été saisie.
          date: grade.graded_on ?? localDay(grade.created_at, timeZone),
          score: grade.score,
          outOf: grade.out_of,
          weight: grade.weight,
        })),
      })),
    })),
  };
}
