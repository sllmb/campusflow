import { describe, expect, it } from "vitest";
import {
  meetsThreshold,
  roundGrade,
  semesterResult,
  subjectAverage,
  toTwenty,
  unitResult,
  type UnitInput,
} from "./average";

const grade = (score: number, outOf = 20, weight = 1) => ({ score, outOf, weight });

const unit = (overrides: Partial<UnitInput> & Pick<UnitInput, "subjects">): UnitInput => ({
  id: "ue",
  ectsCredits: 6,
  juryValidated: false,
  ...overrides,
});

describe("toTwenty : ramène une note sur 20", () => {
  it("laisse une note sur 20 inchangée", () => {
    expect(toTwenty(15, 20)).toBe(15);
  });
  it("convertit une note sur 10 ou sur 100", () => {
    expect(toTwenty(8, 10)).toBe(16);
    expect(toTwenty(65, 100)).toBe(13);
  });
});

describe("subjectAverage : moyenne d'une matière", () => {
  it("vaut null sans aucune note", () => {
    expect(subjectAverage([])).toBeNull();
  });
  it("pondère chaque note par son poids", () => {
    // (12 × 1 + 16 × 2) / 3 = 14,666…
    expect(subjectAverage([grade(12), grade(16, 20, 2)])).toBeCloseTo(14.6667, 4);
  });
  it("mélange des barèmes différents", () => {
    // 8/10 = 16/20 ; (16 + 10) / 2 = 13
    expect(subjectAverage([grade(8, 10), grade(10)])).toBe(13);
  });
});

describe("roundGrade et meetsThreshold : arrondi au centième, comme à l'affichage", () => {
  it("arrondit au centième", () => {
    expect(roundGrade(14.666666)).toBe(14.67);
    expect(roundGrade(9.994)).toBe(9.99);
  });
  it("valide 9,996 (affiché 10,00) mais pas 9,994 (affiché 9,99)", () => {
    expect(meetsThreshold(9.996)).toBe(true);
    expect(meetsThreshold(9.994)).toBe(false);
    expect(meetsThreshold(10)).toBe(true);
  });
});

describe("unitResult : moyenne et validation d'une UE", () => {
  it("compense les matières entre elles (12 coef 2 et 7 coef 1 → 10,33, validée)", () => {
    const result = unitResult(
      unit({
        subjects: [
          { id: "analyse", coefficient: 2, grades: [grade(12)] },
          { id: "algebre", coefficient: 1, grades: [grade(7)] },
        ],
      }),
    );
    expect(result.average).toBeCloseTo(10.3333, 4);
    expect(result.status).toBe("validated");
    expect(result.complete).toBe(true);
  });

  it("n'est pas validée sous 10 (9,5)", () => {
    const result = unitResult(
      unit({ subjects: [{ id: "a", coefficient: 1, grades: [grade(9.5)] }] }),
    );
    expect(result.average).toBe(9.5);
    expect(result.status).toBe("failed");
  });

  it("est validée par le jury malgré 9,5 si la case est cochée", () => {
    const result = unitResult(
      unit({ juryValidated: true, subjects: [{ id: "a", coefficient: 1, grades: [grade(9.5)] }] }),
    );
    expect(result.status).toBe("jury");
  });

  it("ignore la décision du jury quand la moyenne atteint déjà 10", () => {
    const result = unitResult(
      unit({ juryValidated: true, subjects: [{ id: "a", coefficient: 1, grades: [grade(11)] }] }),
    );
    expect(result.status).toBe("validated");
  });

  it("est provisoire tant qu'une matière n'a pas de note", () => {
    const result = unitResult(
      unit({
        subjects: [
          { id: "a", coefficient: 1, grades: [grade(14)] },
          { id: "b", coefficient: 1, grades: [] },
        ],
      }),
    );
    expect(result.average).toBe(14); // seules les matières notées comptent
    expect(result.complete).toBe(false);
  });

  it("n'a pas de moyenne sans aucune note", () => {
    const result = unitResult(unit({ subjects: [{ id: "a", coefficient: 1, grades: [] }] }));
    expect(result.average).toBeNull();
    expect(result.status).toBe("none");
  });

  it("expose la moyenne de chaque matière", () => {
    const result = unitResult(
      unit({ subjects: [{ id: "a", coefficient: 1, grades: [grade(12), grade(16)] }] }),
    );
    expect(result.subjects).toEqual([{ id: "a", average: 14 }]);
  });
});

describe("semesterResult : moyenne, validation et crédits du semestre", () => {
  const ue1 = (score: number) =>
    unit({
      id: "ue1",
      ectsCredits: 6,
      subjects: [{ id: "a", coefficient: 1, grades: [grade(score)] }],
    });
  const ue2 = (score: number, juryValidated = false) =>
    unit({
      id: "ue2",
      ectsCredits: 3,
      juryValidated,
      subjects: [{ id: "b", coefficient: 1, grades: [grade(score)] }],
    });

  it("pondère les UE par leurs crédits et compense entre UE (12 × 6 + 7 × 3) / 9 = 10,33", () => {
    const result = semesterResult([ue1(12), ue2(7)]);
    expect(result.average).toBeCloseTo(10.3333, 4);
    expect(result.status).toBe("validated");
    // Semestre validé : tous les crédits sont acquis, y compris ceux de l'UE à 7.
    expect(result.creditsEarned).toBe(9);
    expect(result.creditsTotal).toBe(9);
  });

  it("n'accorde que les crédits des UE validées si le semestre n'est pas validé", () => {
    // (11 × 6 + 5 × 3) / 9 = 9
    const result = semesterResult([ue1(11), ue2(5)]);
    expect(result.average).toBe(9);
    expect(result.status).toBe("failed");
    expect(result.creditsEarned).toBe(6);
  });

  it("compte les crédits d'une UE validée par le jury", () => {
    const result = semesterResult([ue1(9), ue2(9.5, true)]);
    expect(result.status).toBe("failed");
    expect(result.creditsEarned).toBe(3);
  });

  it("n'a ni moyenne ni crédits sans aucune note", () => {
    const result = semesterResult([unit({ subjects: [{ id: "a", coefficient: 1, grades: [] }] })]);
    expect(result.average).toBeNull();
    expect(result.status).toBe("none");
    expect(result.creditsEarned).toBe(0);
    expect(result.complete).toBe(false);
  });

  it("est provisoire tant qu'une UE est incomplète", () => {
    const incomplete = unit({
      id: "ue3",
      ectsCredits: 3,
      subjects: [{ id: "c", coefficient: 1, grades: [] }],
    });
    const result = semesterResult([ue1(12), incomplete]);
    expect(result.average).toBe(12);
    expect(result.complete).toBe(false);
  });

  it("gère un semestre sans UE", () => {
    const result = semesterResult([]);
    expect(result.average).toBeNull();
    expect(result.creditsTotal).toBe(0);
  });
});
