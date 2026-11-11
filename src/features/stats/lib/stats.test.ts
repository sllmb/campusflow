import { describe, expect, it } from "vitest";
import {
  averageTimeline,
  currentStreak,
  focusByDay,
  focusBySubject,
  lastDays,
  localDay,
  onTimeRate,
  parsePeriod,
  type DatedUnit,
  type SessionInput,
} from "./stats";

const PARIS = "Europe/Paris";
const maths = { id: "m", name: "Maths", color: 1 };
const physique = { id: "p", name: "Physique", color: 2 };

const session = (
  startedAt: string,
  minutes: number,
  subject: SessionInput["subject"] = null,
): SessionInput => ({ startedAt, focusedSeconds: minutes * 60, subject });

describe("période", () => {
  it("7 jours par défaut, 30 sur demande", () => {
    expect(parsePeriod("30")).toBe(30);
    expect(parsePeriod("7")).toBe(7);
    expect(parsePeriod("365")).toBe(7);
    expect(parsePeriod(undefined)).toBe(7);
  });

  it("liste les derniers jours, aujourd'hui compris", () => {
    expect(lastDays("2026-11-11", 3)).toEqual(["2026-11-09", "2026-11-10", "2026-11-11"]);
    expect(lastDays("2026-03-01", 2)).toEqual(["2026-02-28", "2026-03-01"]);
  });
});

describe("focusByDay", () => {
  it("additionne les sessions de chaque jour, 0 pour les jours vides", () => {
    const days = ["2026-11-10", "2026-11-11"];
    const result = focusByDay(
      [session("2026-11-11T08:00:00Z", 25), session("2026-11-11T14:00:00Z", 50)],
      days,
      PARIS,
    );
    expect(result).toEqual([
      { date: "2026-11-10", seconds: 0 },
      { date: "2026-11-11", seconds: 75 * 60 },
    ]);
  });

  it("une session compte pour le jour où elle a commencé, dans le fuseau de l'étudiant", () => {
    // 23:30 à Paris le 10 = 22:30 UTC le 10 ; un deep work de 2 h finit le 11.
    const late = session("2026-11-10T22:30:00Z", 120);
    expect(localDay(late.startedAt, PARIS)).toBe("2026-11-10");
    const result = focusByDay([late], ["2026-11-10", "2026-11-11"], PARIS);
    expect(result.map((d) => d.seconds)).toEqual([7200, 0]);
    // Même instant vu de Tokyo : déjà le 11 au matin.
    expect(localDay(late.startedAt, "Asia/Tokyo")).toBe("2026-11-11");
  });

  it("ignore les sessions hors des jours demandés", () => {
    const result = focusByDay([session("2026-10-01T10:00:00Z", 60)], ["2026-11-11"], PARIS);
    expect(result).toEqual([{ date: "2026-11-11", seconds: 0 }]);
  });
});

describe("focusBySubject", () => {
  it("regroupe par matière, de la plus travaillée à la moins travaillée", () => {
    const result = focusBySubject([
      session("2026-11-11T08:00:00Z", 30, physique),
      session("2026-11-11T09:00:00Z", 60, maths),
      session("2026-11-11T10:00:00Z", 30, maths),
      session("2026-11-11T11:00:00Z", 30, null),
    ]);
    expect(result.map((r) => [r.name, r.seconds / 60, Math.round(r.share * 100)])).toEqual([
      ["Maths", 90, 60],
      ["Physique", 30, 20],
      ["Sans matière", 30, 20],
    ]);
    expect(result.find((r) => r.key === "none")?.color).toBeNull();
  });

  it("renvoie une liste vide sans session", () => {
    expect(focusBySubject([])).toEqual([]);
  });
});

describe("currentStreak", () => {
  it("compte les jours d'affilée jusqu'à aujourd'hui", () => {
    expect(currentStreak(["2026-11-09", "2026-11-10", "2026-11-11"], "2026-11-11")).toBe(3);
  });

  it("la série d'hier tient encore tant que la journée n'est pas finie", () => {
    expect(currentStreak(["2026-11-09", "2026-11-10"], "2026-11-11")).toBe(2);
  });

  it("un jour sans session casse la série", () => {
    expect(currentStreak(["2026-11-07", "2026-11-08", "2026-11-11"], "2026-11-11")).toBe(1);
    expect(currentStreak(["2026-11-08"], "2026-11-11")).toBe(0);
    expect(currentStreak([], "2026-11-11")).toBe(0);
  });

  it("traverse les changements de mois", () => {
    expect(currentStreak(["2026-10-31", "2026-11-01"], "2026-11-01")).toBe(2);
  });
});

describe("averageTimeline", () => {
  // UE de 6 ECTS : Maths (coef 2), Physique (coef 1).
  const unit = (grades: {
    maths: DatedUnit["subjects"][0]["grades"];
    physique: DatedUnit["subjects"][0]["grades"];
  }): DatedUnit => ({
    id: "ue",
    ectsCredits: 6,
    juryValidated: false,
    subjects: [
      { id: "m", coefficient: 2, grades: grades.maths },
      { id: "p", coefficient: 1, grades: grades.physique },
    ],
  });
  const g = (date: string, score: number) => ({ date, score, outOf: 20, weight: 1 });

  it("donne la moyenne du semestre après chaque jour de notes", () => {
    const timeline = averageTimeline([
      unit({
        maths: [g("2026-10-05", 12), g("2026-11-02", 6)],
        physique: [g("2026-10-20", 7)],
      }),
    ]);
    expect(timeline).toEqual([
      { date: "2026-10-05", average: 12 }, // Maths seule
      { date: "2026-10-20", average: 10.33 }, // (12 × 2 + 7) / 3
      { date: "2026-11-02", average: 8.33 }, // Maths 9 : (9 × 2 + 7) / 3
    ]);
  });

  it("un seul point par jour, même avec plusieurs notes", () => {
    const timeline = averageTimeline([
      unit({ maths: [g("2026-10-05", 12)], physique: [g("2026-10-05", 15)] }),
    ]);
    expect(timeline).toEqual([{ date: "2026-10-05", average: 13 }]);
  });

  it("vide sans note", () => {
    expect(averageTimeline([unit({ maths: [], physique: [] })])).toEqual([]);
    expect(averageTimeline([])).toEqual([]);
  });
});

describe("onTimeRate", () => {
  it("compte les devoirs terminés avant ou à l'échéance", () => {
    expect(
      onTimeRate([
        { dueAt: "2026-11-10T22:59:00Z", completedAt: "2026-11-10T20:00:00Z", status: "done" },
        { dueAt: "2026-11-10T22:59:00Z", completedAt: "2026-11-10T22:59:00Z", status: "done" },
        { dueAt: "2026-11-10T22:59:00Z", completedAt: "2026-11-11T08:00:00Z", status: "done" },
        { dueAt: "2026-11-12T22:59:00Z", completedAt: null, status: "todo" },
      ]),
    ).toEqual({ done: 3, onTime: 2 });
  });
});
