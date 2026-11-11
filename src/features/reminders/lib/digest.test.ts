import { describe, expect, it } from "vitest";
import { buildDigest, reminderDue, type DigestAssignment } from "./digest";

const PARIS = "Europe/Paris";
const TODAY = "2026-11-11"; // mercredi
const a = (title: string, dueAt: string, kind = "homework", status = "todo"): DigestAssignment => ({
  title,
  dueAt,
  kind,
  status,
});

describe("buildDigest", () => {
  it("rien à dire : pas de notification", () => {
    expect(buildDigest({ today: TODAY, timeZone: PARIS, assignments: [], revisions: [] })).toBe(
      null,
    );
    // Un devoir déjà fait ou lointain ne déclenche rien.
    expect(
      buildDigest({
        today: TODAY,
        timeZone: PARIS,
        assignments: [
          a("Fait", "2026-11-11T22:59:00Z", "homework", "done"),
          a("Plus tard", "2026-11-20T22:59:00Z"),
        ],
        revisions: [{ plannedOn: TODAY, minutes: 60, done: true }],
      }),
    ).toBe(null);
  });

  it("échéances du jour, révisions, examen de demain et retards", () => {
    const digest = buildDigest({
      today: TODAY,
      timeZone: PARIS,
      assignments: [
        a("DM Probabilités", "2026-11-11T22:59:00Z"), // 23:59 à Paris
        a("TP Optique", "2026-11-11T13:00:00Z"), // 14:00
        a("Partiel d'algèbre", "2026-11-12T06:30:00Z", "exam"), // demain 07:30
        a("Fiche oubliée", "2026-11-09T22:59:00Z"),
      ],
      revisions: [
        { plannedOn: TODAY, minutes: 75, done: false },
        { plannedOn: TODAY, minutes: 30, done: true },
        { plannedOn: "2026-11-12", minutes: 90, done: false },
      ],
    });
    expect(digest).toEqual({
      title: "Ta journée sur CampusFlow",
      body: [
        "Aujourd'hui : TP Optique (14:00) et DM Probabilités (23:59)",
        "Révisions : 1 h 15",
        "Demain : Partiel d'algèbre (07:30)",
        "En retard : 1",
      ].join("\n"),
      url: "/dashboard",
    });
  });

  it("au-delà de deux échéances : « et N autres »", () => {
    const digest = buildDigest({
      today: TODAY,
      timeZone: PARIS,
      assignments: [
        a("Un", "2026-11-11T08:00:00Z"),
        a("Deux", "2026-11-11T09:00:00Z"),
        a("Trois", "2026-11-11T10:00:00Z"),
        a("Quatre", "2026-11-11T11:00:00Z"),
      ],
      revisions: [],
    });
    expect(digest?.body).toBe("Aujourd'hui : Un (09:00), Deux (10:00) et 2 autres");
  });

  it("seulement un examen demain : titre « À préparer »", () => {
    const digest = buildDigest({
      today: TODAY,
      timeZone: PARIS,
      assignments: [
        a("Projet web", "2026-11-12T16:00:00Z", "project"),
        // Un simple devoir demain ne mérite pas de rappel la veille.
        a("Exercices", "2026-11-12T16:00:00Z"),
      ],
      revisions: [],
    });
    expect(digest).toMatchObject({ title: "À préparer", body: "Demain : Projet web (17:00)" });
  });

  it("le jour se lit dans le fuseau de l'étudiant", () => {
    // 23:30 UTC le 10 = 00:30 le 11 à Paris, mais encore le 10 à Dakar.
    const late = [a("Rendu de minuit", "2026-11-10T23:30:00Z")];
    expect(
      buildDigest({ today: TODAY, timeZone: PARIS, assignments: late, revisions: [] })?.body,
    ).toBe("Aujourd'hui : Rendu de minuit (00:30)");
    expect(
      buildDigest({ today: TODAY, timeZone: "Africa/Dakar", assignments: late, revisions: [] })
        ?.body,
    ).toBe("En retard : 1");
  });
});

describe("reminderDue", () => {
  // Réveil quotidien à 8 h UTC.
  const cron = new Date("2026-11-11T08:00:00Z");

  it("8 h au Sénégal : on prévient", () => {
    expect(reminderDue(cron, "Africa/Dakar", null, 8)).toEqual({ due: true, today: "2026-11-11" });
  });

  it("déjà prévenu aujourd'hui : on ne renvoie pas", () => {
    expect(reminderDue(cron, "Africa/Dakar", "2026-11-11", 8).due).toBe(false);
    expect(reminderDue(cron, "Africa/Dakar", "2026-11-10", 8).due).toBe(true);
  });

  it("à l'est, plus tard dans la matinée : on prévient (9 h à Paris)", () => {
    expect(reminderDue(cron, "Europe/Paris", null, 8).due).toBe(true);
  });

  it("à l'ouest, avant 8 h : on attend (3 h à Montréal)", () => {
    expect(reminderDue(cron, "America/Montreal", null, 8)).toEqual({
      due: false,
      today: "2026-11-11",
    });
    // Avec un réveil toutes les heures, il serait prévenu à 13 h UTC, soit 8 h chez lui.
    expect(reminderDue(new Date("2026-11-11T13:00:00Z"), "America/Montreal", null, 8).due).toBe(
      true,
    );
  });
});
