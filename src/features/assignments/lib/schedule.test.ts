import { describe, expect, it } from "vitest";
import type { AssignmentWithSubject } from "../queries";
import { buildSchedule } from "./schedule";

const TZ = "Europe/Paris";
// Mercredi 11 novembre 2026, 10:00 à Paris (09:00 UTC).
const NOW = new Date("2026-11-11T09:00:00Z");

let seq = 0;
function assignment(dueAt: string, status: AssignmentWithSubject["status"] = "todo") {
  seq += 1;
  return {
    id: `a${seq}`,
    user_id: "u",
    subject_id: "s",
    kind: "homework",
    title: `Devoir ${seq}`,
    notes: null,
    due_at: dueAt,
    status,
    priority: "normal",
    completed_at: status === "done" ? "2026-11-10T12:00:00Z" : null,
    created_at: "",
    updated_at: "",
    subject: { id: "s", name: "Analyse", color: 1 },
  } satisfies AssignmentWithSubject;
}

const keysOf = (schedule: ReturnType<typeof buildSchedule>) =>
  Object.fromEntries(schedule.buckets.map((b) => [b.key, b.items.map((i) => i.title)]));

describe("buildSchedule : classement des échéances", () => {
  it("range chaque échéance dans le bon groupe, à l'heure de Paris", () => {
    const items = [
      assignment("2026-11-10T22:59:00Z"), // hier 23:59 → en retard
      assignment("2026-11-11T08:00:00Z"), // aujourd'hui 09:00, déjà passé → en retard
      assignment("2026-11-11T22:59:00Z"), // aujourd'hui 23:59
      assignment("2026-11-11T23:30:00Z"), // demain 00:30 à Paris (encore le 11 en UTC)
      assignment("2026-11-16T10:00:00Z"), // lundi → cette semaine
      assignment("2026-11-18T10:00:00Z"), // dans 7 jours → plus tard
      assignment("2026-11-01T10:00:00Z", "done"), // terminé, même en retard
    ];
    const schedule = buildSchedule(items, NOW, TZ);
    const [y, passed, today, tomorrow, week, later] = items.map((i) => i.title);
    expect(keysOf(schedule)).toEqual({
      overdue: [y, passed],
      today: [today],
      tomorrow: [tomorrow],
      week: [week],
      later: [later],
    });
    expect(schedule.done.map((d) => d.title)).toEqual([items[6].title]);
    expect(schedule.overdue).toBe(2);
    expect(schedule.dueThisWeek).toBe(3);
    expect(schedule.pending[0].overdue).toBe(true);
  });

  it("donne des libellés lisibles", () => {
    const schedule = buildSchedule(
      [assignment("2026-11-11T22:59:00Z"), assignment("2026-11-12T07:30:00Z")],
      NOW,
      TZ,
    );
    expect(schedule.pending.map((p) => p.dueLabel)).toEqual(["Aujourd'hui 23:59", "Demain 08:30"]);
  });
});
