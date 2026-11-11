import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type RevisionRow = Database["public"]["Tables"]["revision_sessions"]["Row"];

export type RevisionSlot = RevisionRow & {
  assignment: { id: string; title: string; kind: string };
  subject: { id: string; name: string; color: number };
};

/**
 * Créneaux de révision avec leur examen et leur matière, triés par jour.
 * `between` : premier et dernier jour inclus (« AAAA-MM-JJ »).
 */
export async function listRevisionSlots(between?: {
  first: string;
  last: string;
}): Promise<RevisionSlot[]> {
  const supabase = await createClient();
  let query = supabase
    .from("revision_sessions")
    .select("*")
    .order("planned_on")
    .order("created_at");
  if (between) query = query.gte("planned_on", between.first).lte("planned_on", between.last);

  const [slots, assignments, subjects] = await Promise.all([
    query,
    supabase.from("assignments").select("id, title, kind, subject_id"),
    supabase.from("subjects").select("id, name, color"),
  ]);
  if (slots.error) throw slots.error;
  if (assignments.error) throw assignments.error;
  if (subjects.error) throw subjects.error;

  const assignmentById = new Map(assignments.data.map((a) => [a.id, a]));
  const subjectById = new Map(subjects.data.map((s) => [s.id, s]));
  return slots.data.flatMap((slot) => {
    const assignment = assignmentById.get(slot.assignment_id);
    const subject = assignment && subjectById.get(assignment.subject_id);
    if (!assignment || !subject) return [];
    return [
      {
        ...slot,
        assignment: { id: assignment.id, title: assignment.title, kind: assignment.kind },
        subject,
      },
    ];
  });
}

/** Créneaux regroupés par examen (pour la page Devoirs). */
export function groupByAssignment(slots: RevisionSlot[]) {
  const map = new Map<string, RevisionSlot[]>();
  for (const slot of slots) {
    const list = map.get(slot.assignment_id);
    if (list) list.push(slot);
    else map.set(slot.assignment_id, [slot]);
  }
  return map;
}
