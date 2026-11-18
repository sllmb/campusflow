import { describe, expect, it } from "vitest";
import { canPublish, checkAnswers, optionsError, parseOptions, type Question } from "./forms";

const questions: Question[] = [
  { id: "ecole", kind: "short_text", label: "Ton école", required: true, options: [] },
  { id: "avis", kind: "long_text", label: "Ton avis", required: false, options: [] },
  { id: "annee", kind: "single_choice", label: "Année", required: true, options: ["L1", "L2"] },
  {
    id: "outils",
    kind: "multiple_choice",
    label: "Outils",
    required: false,
    options: ["Notes", "Pomodoro", "Calendrier"],
  },
  { id: "note", kind: "scale", label: "Recommandation", required: true, options: [] },
];

/** Simule les champs envoyés par le navigateur. */
const reader = (fields: Record<string, string | string[]>) => (name: string) => {
  const value = fields[name];
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
};

describe("parseOptions", () => {
  it("un choix par ligne, sans vides ni doublons", () => {
    expect(parseOptions(" L1 \n\nL2\nL1\r\n  Master   1 ")).toEqual(["L1", "L2", "Master 1"]);
  });
});

describe("optionsError", () => {
  it("au moins 2 choix pour les questions à choix", () => {
    expect(optionsError("single_choice", ["Oui"])).toBe("Propose au moins 2 choix.");
    expect(optionsError("multiple_choice", ["A", "B"])).toBe(null);
    expect(optionsError("short_text", [])).toBe(null);
  });

  it("refuse trop de choix ou des choix trop longs", () => {
    expect(
      optionsError(
        "single_choice",
        Array.from({ length: 21 }, (_, i) => `${i}`),
      ),
    ).toBe("20 choix au plus.");
    expect(optionsError("single_choice", ["A", "x".repeat(101)])).toBe(
      "100 caractères au plus par choix.",
    );
  });
});

describe("canPublish", () => {
  it("il faut au moins une question", () => {
    expect(canPublish([])).toBe(false);
    expect(canPublish([{}])).toBe(true);
  });
});

describe("checkAnswers", () => {
  it("accepte des réponses valides et les met en forme", () => {
    const result = checkAnswers(
      questions,
      reader({
        "q-ecole": "  ESP  ",
        "q-annee": "L2",
        "q-outils": ["Calendrier", "Notes", "Notes"],
        "q-note": "4",
        "q-inconnue": "ignorée",
      }),
    );
    expect(result).toEqual({
      ok: true,
      answers: { ecole: "ESP", annee: "L2", outils: ["Notes", "Calendrier"], note: 4 },
    });
  });

  it("signale chaque réponse obligatoire manquante", () => {
    const result = checkAnswers(questions, reader({ "q-ecole": "   " }));
    expect(result).toEqual({
      ok: false,
      errors: {
        ecole: "Réponse obligatoire.",
        annee: "Réponse obligatoire.",
        note: "Réponse obligatoire.",
      },
    });
  });

  it("refuse un choix qui n'est pas proposé, même envoyé à la main", () => {
    const result = checkAnswers(
      questions,
      reader({
        "q-ecole": "ESP",
        "q-annee": "Doctorat",
        "q-outils": ["Notes", "Piratage"],
        "q-note": "3",
      }),
    );
    expect(result).toEqual({
      ok: false,
      errors: { annee: "Choix inconnu.", outils: "Choix inconnu." },
    });
  });

  it("refuse une note hors de 1 à 5 et un texte trop long", () => {
    for (const note of ["0", "6", "2.5", "abc"]) {
      const result = checkAnswers(
        questions,
        reader({ "q-ecole": "ESP", "q-annee": "L1", "q-note": note }),
      );
      expect(result.ok).toBe(false);
    }
    const long = checkAnswers(
      questions,
      reader({ "q-ecole": "x".repeat(301), "q-annee": "L1", "q-note": "5" }),
    );
    expect(long).toEqual({ ok: false, errors: { ecole: "300 caractères au plus." } });
  });
});
