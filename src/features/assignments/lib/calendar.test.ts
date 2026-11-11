import { describe, expect, it } from "vitest";
import {
  addDays,
  capitalize,
  dayLabel,
  groupByDay,
  monthGrid,
  monthLabel,
  parseDay,
  parseView,
  shiftMonth,
  startOfWeek,
  stepDate,
  visibleRange,
  weekDays,
  weekLabel,
} from "./calendar";

describe("parseDay", () => {
  it("accepte une vraie date", () => {
    expect(parseDay("2026-11-17")).toBe("2026-11-17");
    expect(parseDay("2028-02-29")).toBe("2028-02-29"); // année bissextile
  });

  it("refuse les dates impossibles et les formats inattendus", () => {
    expect(parseDay("2026-02-31")).toBeNull();
    expect(parseDay("2026-02-29")).toBeNull();
    expect(parseDay("2026-13-01")).toBeNull();
    expect(parseDay("17/11/2026")).toBeNull();
    expect(parseDay("2026-11-17T10:00")).toBeNull();
    expect(parseDay(undefined)).toBeNull();
    expect(parseDay(["2026-11-17"])).toBeNull();
  });
});

describe("parseView", () => {
  it("vaut « mois » par défaut", () => {
    expect(parseView("semaine")).toBe("semaine");
    expect(parseView("mois")).toBe("mois");
    expect(parseView("n'importe quoi")).toBe("mois");
    expect(parseView(undefined)).toBe("mois");
  });
});

describe("dates", () => {
  it("ajoute des jours en changeant de mois et d'année", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("ne perd pas de jour au changement d'heure (29 mars et 25 octobre 2026)", () => {
    expect(addDays("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDays("2026-03-29", 1)).toBe("2026-03-30");
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
  });

  it("trouve le lundi de la semaine", () => {
    expect(startOfWeek("2026-11-17")).toBe("2026-11-16"); // mardi → lundi
    expect(startOfWeek("2026-11-16")).toBe("2026-11-16"); // lundi
    expect(startOfWeek("2026-11-22")).toBe("2026-11-16"); // dimanche → lundi précédent
    expect(startOfWeek("2027-01-01")).toBe("2026-12-28"); // à cheval sur deux années
  });

  it("change de mois en revenant au 1er", () => {
    expect(shiftMonth("2026-01-31", 1)).toBe("2026-02-01");
    expect(shiftMonth("2026-01-15", -1)).toBe("2025-12-01");
    expect(shiftMonth("2026-11-17", 0)).toBe("2026-11-01");
  });

  it("avance d'une période selon la vue", () => {
    expect(stepDate("mois", "2026-11-17", 1)).toBe("2026-12-01");
    expect(stepDate("mois", "2026-11-17", -1)).toBe("2026-10-01");
    expect(stepDate("semaine", "2026-11-17", 1)).toBe("2026-11-24");
    expect(stepDate("semaine", "2026-11-17", -1)).toBe("2026-11-10");
  });
});

describe("monthGrid", () => {
  it("novembre 2026 : commence un dimanche, 6 semaines", () => {
    const weeks = monthGrid("2026-11-17");
    expect(weeks).toHaveLength(6);
    expect(weeks[0][0]).toEqual({ date: "2026-10-26", day: 26, inMonth: false });
    expect(weeks[0][6]).toEqual({ date: "2026-11-01", day: 1, inMonth: true });
    expect(weeks[5][6]).toEqual({ date: "2026-12-06", day: 6, inMonth: false });
  });

  it("février 2027 : commence un lundi et tient en 4 semaines pile", () => {
    const weeks = monthGrid("2027-02-10");
    expect(weeks).toHaveLength(4);
    expect(weeks[0][0].date).toBe("2027-02-01");
    expect(weeks[3][6].date).toBe("2027-02-28");
    expect(weeks.flat().every((d) => d.inMonth)).toBe(true);
  });

  it("chaque semaine a 7 jours qui se suivent", () => {
    for (const date of ["2026-01-01", "2026-06-15", "2028-02-29"]) {
      const days = monthGrid(date).flat();
      days.slice(1).forEach((day, i) => expect(day.date).toBe(addDays(days[i].date, 1)));
      expect(days.length % 7).toBe(0);
    }
  });
});

describe("weekDays et visibleRange", () => {
  it("donne les 7 jours du lundi au dimanche", () => {
    expect(weekDays("2026-11-17").map((d) => d.day)).toEqual([16, 17, 18, 19, 20, 21, 22]);
  });

  it("couvre toute la grille affichée", () => {
    expect(visibleRange("mois", "2026-11-17")).toEqual({ first: "2026-10-26", last: "2026-12-06" });
    expect(visibleRange("semaine", "2026-11-17")).toEqual({
      first: "2026-11-16",
      last: "2026-11-22",
    });
  });
});

describe("groupByDay", () => {
  it("range par jour local et trie par heure", () => {
    const items = [
      { id: "b", dueLocal: "2026-11-17T23:59" },
      { id: "a", dueLocal: "2026-11-17T08:30" },
      { id: "c", dueLocal: "2026-11-18T00:00" },
    ];
    const byDay = groupByDay(items);
    expect(byDay.get("2026-11-17")?.map((i) => i.id)).toEqual(["a", "b"]);
    expect(byDay.get("2026-11-18")?.map((i) => i.id)).toEqual(["c"]);
    expect(byDay.has("2026-11-19")).toBe(false);
  });
});

describe("libellés", () => {
  it("écrit les dates en français", () => {
    expect(monthLabel("2026-11-17")).toBe("novembre 2026");
    expect(dayLabel("2026-11-17")).toBe("mardi 17 novembre");
    expect(weekLabel("2026-11-17")).toBe("16 – 22 nov. 2026");
    expect(weekLabel("2026-12-01")).toBe("30 nov. – 6 déc. 2026");
    expect(capitalize(dayLabel("2026-11-17"))).toBe("Mardi 17 novembre");
  });
});
