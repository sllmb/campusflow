import "server-only";
import { createClient } from "@/lib/supabase/server";
import { localInputToUtc } from "@/lib/time";
import type { Database } from "@/types/database";

type Row = Database["public"]["Tables"]["focus_sessions"]["Row"];
export type FocusSession = Row & { subject: { name: string; color: number } | null };

export type FocusToday = {
  sessions: FocusSession[];
  totalSeconds: number;
  pomodoroCount: number;
};

/** Sessions terminées aujourd'hui (jour calendaire dans le fuseau de l'utilisateur). */
export async function getFocusToday(today: string, timeZone: string): Promise<FocusToday> {
  const startOfDay = localInputToUtc(`${today}T00:00`, timeZone);
  const supabase = await createClient();
  const [{ data: sessions, error }, { data: subjects, error: subjectsError }] = await Promise.all([
    supabase
      .from("focus_sessions")
      .select("*")
      .gte("ended_at", startOfDay ?? today)
      .order("ended_at", { ascending: false }),
    supabase.from("subjects").select("id, name, color"),
  ]);
  if (error) throw error;
  if (subjectsError) throw subjectsError;

  const byId = new Map(subjects.map((subject) => [subject.id, subject]));
  const shaped = sessions.map((session) => {
    const subject = session.subject_id ? byId.get(session.subject_id) : undefined;
    return { ...session, subject: subject ? { name: subject.name, color: subject.color } : null };
  });

  return {
    sessions: shaped,
    totalSeconds: shaped.reduce((sum, session) => sum + session.focused_seconds, 0),
    pomodoroCount: shaped.filter((s) => s.mode === "pomodoro" && s.completed).length,
  };
}
