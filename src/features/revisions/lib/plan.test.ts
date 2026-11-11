import { describe, expect, it } from "vitest";
import {
  availableDays,
  launchHref,
  planRevisions,
  slotDayLabel,
  summarize,
  weekdayIndex,
} from "./plan";

const ALL = [0, 1, 2, 3, 4, 5, 6];
const minutes = (result: ReturnType<typeof planRevisions>) =>
  result.ok ? result.slots.map((s) => [s.date, s.minutes]) : result;

describe("jours disponibles", () => {
  it("numérote les jours du lundi (0) au dimanche (6)", () => {
    expect(weekdayIndex("2026-11-16")).toBe(0); // lundi
    expect(weekdayIndex("2026-11-22")).toBe(6); // dimanche
  });

  it("d'aujourd'hui à la veille de l'examen, jours choisis seulement", () => {
    // Mercredi 11 → examen lundi 16 ; sans le dimanche.
    expect(availableDays("2026-11-11", "2026-11-16", [0, 1, 2, 3, 4, 5])).toEqual([
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
    ]);
  });

  it("aucun jour si l'examen est aujourd'hui", () => {
    expect(availableDays("2026-11-11", "2026-11-11", ALL)).toEqual([]);
  });
});

describe("planRevisions", () => {
  it("10 h sur 7 jours : 1 h 15 par jour, 1 h 30 les 5 derniers (division euclidienne)", () => {
    // 600 min = 40 blocs ; 40 = 7 × 5 + 5.
    const result = planRevisions({
      today: "2026-11-09",
      examDay: "2026-11-16",
      totalMinutes: 600,
      weekdays: ALL,
    });
    expect(minutes(result)).toEqual([
      ["2026-11-09", 75],
      ["2026-11-10", 75],
      ["2026-11-11", 90],
      ["2026-11-12", 90],
      ["2026-11-13", 90],
      ["2026-11-14", 90],
      ["2026-11-15", 90],
    ]);
    expect(result.ok && result.slots.reduce((sum, s) => sum + s.minutes, 0)).toBe(600);
  });

  it("moins de blocs que de jours : les blocs vont aux derniers jours", () => {
    const result = planRevisions({
      today: "2026-11-09",
      examDay: "2026-11-16",
      totalMinutes: 30,
      weekdays: ALL,
    });
    expect(minutes(result)).toEqual([
      ["2026-11-14", 15],
      ["2026-11-15", 15],
    ]);
  });

  it("examen demain : tout aujourd'hui", () => {
    const result = planRevisions({
      today: "2026-11-11",
      examDay: "2026-11-12",
      totalMinutes: 180,
      weekdays: ALL,
    });
    expect(minutes(result)).toEqual([["2026-11-11", 180]]);
  });

  it("respecte les jours choisis", () => {
    // Du lundi 9 au dimanche 15, seulement mardi et jeudi.
    const result = planRevisions({
      today: "2026-11-09",
      examDay: "2026-11-16",
      totalMinutes: 240,
      weekdays: [1, 3],
    });
    expect(minutes(result)).toEqual([
      ["2026-11-10", 120],
      ["2026-11-12", 120],
    ]);
  });

  it("refuse s'il n'y a aucun jour disponible", () => {
    expect(
      planRevisions({
        today: "2026-11-11",
        examDay: "2026-11-11",
        totalMinutes: 60,
        weekdays: ALL,
      }),
    ).toEqual({ ok: false, reason: "no-days" });
    expect(
      planRevisions({ today: "2026-11-09", examDay: "2026-11-16", totalMinutes: 60, weekdays: [] }),
    ).toEqual({ ok: false, reason: "no-days" });
  });

  it("refuse plus de 10 h par jour, et dit le maximum possible", () => {
    // 2 jours disponibles : 20 h au plus.
    expect(
      planRevisions({
        today: "2026-11-14",
        examDay: "2026-11-16",
        totalMinutes: 21 * 60,
        weekdays: ALL,
      }),
    ).toEqual({ ok: false, reason: "too-much", maxMinutes: 1200 });
    expect(
      planRevisions({
        today: "2026-11-14",
        examDay: "2026-11-16",
        totalMinutes: 20 * 60,
        weekdays: ALL,
      }).ok,
    ).toBe(true);
  });

  it("arrondit au quart d'heure", () => {
    const result = planRevisions({
      today: "2026-11-11",
      examDay: "2026-11-12",
      totalMinutes: 97,
      weekdays: ALL,
    });
    expect(minutes(result)).toEqual([["2026-11-11", 90]]);
  });
});

describe("summarize", () => {
  it("temps fait, prochain créneau et créneaux manqués", () => {
    const slots = [
      { planned_on: "2026-11-09", minutes: 60, done: true },
      { planned_on: "2026-11-10", minutes: 60, done: false },
      { planned_on: "2026-11-12", minutes: 90, done: false },
      { planned_on: "2026-11-11", minutes: 45, done: false },
    ];
    expect(summarize(slots, "2026-11-11")).toEqual({
      total: 255,
      done: 60,
      next: { planned_on: "2026-11-11", minutes: 45, done: false },
      missed: 1,
    });
  });

  it("aucun prochain créneau quand tout est fait", () => {
    expect(
      summarize([{ planned_on: "2026-11-11", minutes: 60, done: true }], "2026-11-11").next,
    ).toBe(null);
  });
});

describe("libellés et lancement", () => {
  it("dit aujourd'hui, demain, hier, sinon la date", () => {
    expect(slotDayLabel("2026-11-11", "2026-11-11")).toBe("Aujourd'hui");
    expect(slotDayLabel("2026-11-12", "2026-11-11")).toBe("Demain");
    expect(slotDayLabel("2026-11-10", "2026-11-11")).toBe("Hier");
    expect(slotDayLabel("2026-11-17", "2026-11-11")).toBe("Mardi 17 novembre");
  });

  it("deep work dès 1 h, Pomodoro en dessous", () => {
    expect(launchHref({ minutes: 90, subjectId: "s1" })).toBe(
      "/pomodoro?mode=deep_work&minutes=90&matiere=s1",
    );
    expect(launchHref({ minutes: 45, subjectId: "s1" })).toBe("/pomodoro?mode=pomodoro&matiere=s1");
  });
});
