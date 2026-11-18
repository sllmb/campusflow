import { describe, expect, it } from "vitest";
import type { Question } from "./forms";
import { csvCell, summarize, toCsv, type ResponseInput } from "./results";

const questions: Question[] = [
  { id: "ecole", kind: "short_text", label: "Ton école", required: false, options: [] },
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

const responses: ResponseInput[] = [
  {
    submittedAt: "2026-11-18T09:00:00Z",
    answers: { ecole: "ESP", annee: "L2", outils: ["Notes", "Calendrier"], note: 5 },
  },
  {
    submittedAt: "2026-11-18T10:00:00Z",
    answers: { ecole: "UCAD", annee: "L2", outils: ["Notes"], note: 4 },
  },
  { submittedAt: "2026-11-18T11:00:00Z", answers: { annee: "L1", note: 2, inconnue: "x" } },
];

describe("summarize", () => {
  const [ecole, annee, outils, note] = summarize(questions, responses);

  it("textes : les plus récents d'abord, réponses vides ignorées", () => {
    expect(ecole).toMatchObject({
      kind: "text",
      answered: 2,
      texts: [{ text: "UCAD" }, { text: "ESP" }],
    });
  });

  it("choix unique : effectif et part de chaque choix", () => {
    expect(annee).toMatchObject({
      kind: "choice",
      answered: 3,
      counts: [
        { option: "L1", count: 1 },
        { option: "L2", count: 2 },
      ],
    });
    if (annee.kind === "choice") expect(annee.counts[1].share).toBeCloseTo(2 / 3);
  });

  it("cases à cocher : part calculée sur ceux qui ont répondu (total > 100 % possible)", () => {
    expect(outils).toMatchObject({
      kind: "choice",
      answered: 2,
      counts: [
        { option: "Notes", count: 2, share: 1 },
        { option: "Pomodoro", count: 0, share: 0 },
        { option: "Calendrier", count: 1, share: 0.5 },
      ],
    });
  });

  it("échelle : moyenne arrondie au dixième et répartition de 1 à 5", () => {
    expect(note).toMatchObject({ kind: "scale", answered: 3, average: 3.7 });
    if (note.kind === "scale") {
      expect(note.counts.map((c) => c.count)).toEqual([0, 1, 0, 1, 1]);
    }
  });

  it("formulaire nominatif : le prénom accompagne les réponses écrites", () => {
    const [summary] = summarize(
      [questions[0]],
      [{ ...responses[0], respondent: { name: "Awa", email: "awa@esp.sn" } }],
    );
    expect(summary).toMatchObject({ texts: [{ text: "ESP", by: "Awa" }] });
  });

  it("aucune réponse : zéro partout, pas de moyenne", () => {
    const summaries = summarize(questions, []);
    expect(summaries.map((s) => s.answered)).toEqual([0, 0, 0, 0]);
    expect(summaries[3]).toMatchObject({ average: null });
  });
});

describe("csvCell", () => {
  it('met entre guillemets ce qui contient ; " ou un retour à la ligne', () => {
    expect(csvCell("simple")).toBe("simple");
    expect(csvCell("a;b")).toBe('"a;b"');
    expect(csvCell('il a dit "oui"')).toBe('"il a dit ""oui"""');
    expect(csvCell("ligne 1\nligne 2")).toBe('"ligne 1\nligne 2"');
    expect(csvCell(4)).toBe("4");
  });

  it("neutralise les formules de tableur", () => {
    expect(csvCell('=HYPERLINK("http://pirate")')).toBe('"\'=HYPERLINK(""http://pirate"")"');
    expect(csvCell("+33 6")).toBe("'+33 6");
    expect(csvCell("-5")).toBe("'-5");
    expect(csvCell("@cmd")).toBe("'@cmd");
  });
});

describe("toCsv", () => {
  const formatDate = (iso: string) => iso.slice(0, 10);

  it("une ligne par réponse, dans l'ordre d'arrivée, avec la marque UTF-8", () => {
    const csv = toCsv(questions, responses, { nominative: false, formatDate });
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv.slice(1).split("\r\n")).toEqual([
      "Date;Ton école;Année;Outils;Recommandation",
      "2026-11-18;ESP;L2;Notes, Calendrier;5",
      "2026-11-18;UCAD;L2;Notes;4",
      "2026-11-18;;L1;;2",
    ]);
  });

  it("nominatif : prénom et e-mail en plus", () => {
    const csv = toCsv(
      [questions[1]],
      [{ ...responses[0], respondent: { name: "Awa", email: "awa@esp.sn" } }],
      { nominative: true, formatDate },
    );
    expect(csv.slice(1).split("\r\n")).toEqual([
      "Date;Prénom;E-mail;Année",
      "2026-11-18;Awa;awa@esp.sn;L2",
    ]);
  });
});
