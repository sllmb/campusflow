/**
 * Calcul des moyennes — fonctions pures, sans base de données ni React.
 *
 * Règles (modèle LMD, décidées le 11 novembre 2026) :
 * - une note est ramenée sur 20, puis pondérée par son poids dans la matière ;
 * - moyenne d'une UE = moyenne des matières notées, pondérée par leur coefficient ;
 *   les matières se compensent à l'intérieur de l'UE ;
 * - UE validée si sa moyenne ≥ 10, ou par décision du jury ;
 * - moyenne du semestre = moyenne des UE notées, pondérée par leurs crédits ECTS ;
 *   les UE se compensent ; semestre validé si sa moyenne ≥ 10 ;
 * - crédits acquis : tous si le semestre est validé, sinon ceux des UE validées ;
 * - le seuil de 10 s'applique à la moyenne arrondie au centième, celle qui est affichée.
 */

export const PASSING_GRADE = 10;

export type GradeInput = { score: number; outOf: number; weight: number };
export type SubjectInput = { id: string; coefficient: number; grades: GradeInput[] };
export type UnitInput = {
  id: string;
  ectsCredits: number;
  juryValidated: boolean;
  subjects: SubjectInput[];
};

/** `none` : aucune note ; `jury` : validée par décision du jury malgré une moyenne < 10. */
export type UnitStatus = "none" | "validated" | "jury" | "failed";
export type SemesterStatus = "none" | "validated" | "failed";

export type UnitResult = {
  id: string;
  average: number | null;
  status: UnitStatus;
  /** Toutes les matières de l'UE ont au moins une note. */
  complete: boolean;
  subjects: { id: string; average: number | null }[];
};

export type SemesterResult = {
  average: number | null;
  status: SemesterStatus;
  complete: boolean;
  creditsEarned: number;
  creditsTotal: number;
  units: UnitResult[];
};

export function toTwenty(score: number, outOf: number) {
  return (score / outOf) * 20;
}

/** Arrondi au centième (14,666… → 14,67). */
export function roundGrade(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function meetsThreshold(average: number) {
  return roundGrade(average) >= PASSING_GRADE;
}

/** Moyenne pondérée ; null si aucun poids. */
function weightedMean(items: { value: number; weight: number }[]) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return null;
  return items.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight;
}

export function subjectAverage(grades: GradeInput[]) {
  return weightedMean(
    grades.map((grade) => ({ value: toTwenty(grade.score, grade.outOf), weight: grade.weight })),
  );
}

export function unitResult(unit: UnitInput): UnitResult {
  const subjects = unit.subjects.map((subject) => ({
    id: subject.id,
    coefficient: subject.coefficient,
    average: subjectAverage(subject.grades),
  }));
  const graded = subjects.filter(
    (subject): subject is typeof subject & { average: number } => subject.average !== null,
  );
  const average = weightedMean(
    graded.map((subject) => ({ value: subject.average, weight: subject.coefficient })),
  );

  let status: UnitStatus = "none";
  if (average !== null) {
    if (meetsThreshold(average)) status = "validated";
    else status = unit.juryValidated ? "jury" : "failed";
  }

  return {
    id: unit.id,
    average,
    status,
    complete: subjects.length > 0 && graded.length === subjects.length,
    subjects: subjects.map(({ id, average }) => ({ id, average })),
  };
}

export function semesterResult(units: UnitInput[]): SemesterResult {
  const results = units.map(unitResult);
  const creditsTotal = units.reduce((sum, unit) => sum + unit.ectsCredits, 0);
  const average = weightedMean(
    results.flatMap((result, index) =>
      result.average === null ? [] : [{ value: result.average, weight: units[index].ectsCredits }],
    ),
  );

  const status: SemesterStatus =
    average === null ? "none" : meetsThreshold(average) ? "validated" : "failed";

  const creditsEarned =
    status === "validated"
      ? creditsTotal
      : results.reduce(
          (sum, result, index) =>
            result.status === "validated" || result.status === "jury"
              ? sum + units[index].ectsCredits
              : sum,
          0,
        );

  return {
    average,
    status,
    complete: results.length > 0 && results.every((result) => result.complete),
    creditsEarned,
    creditsTotal,
    units: results,
  };
}
