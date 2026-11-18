import { describe, expect, it } from "vitest";
import {
  adminAccess,
  adoptionSummary,
  isStaleUnconfirmed,
  signupsByDay,
  type AccountInfo,
} from "./adoption";

const NOW = new Date("2026-11-18T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();
const account = (
  id: string,
  created: number,
  confirmed: boolean,
  lastSignIn: number | null = null,
): AccountInfo => ({
  id,
  createdAt: daysAgo(created),
  confirmedAt: confirmed ? daysAgo(created) : null,
  lastSignInAt: lastSignIn === null ? null : daysAgo(lastSignIn),
});

describe("adoptionSummary", () => {
  const accounts = [
    account("a", 30, true, 1), // connecté hier : actif
    account("b", 20, true, 15), // pas connecté, mais a écrit cette semaine : actif
    account("c", 20, true, 15), // inactif
    account("d", 2, true, null), // nouveau
    account("e", 10, false), // jamais confirmé, plus de 7 jours : suspect
    account("f", 3, false), // jamais confirmé, récent : laissé en paix
  ];

  it("compte inscrits, confirmés, actifs, nouveaux et comptes suspects", () => {
    expect(adoptionSummary(accounts, new Set(["b", "e"]), NOW)).toEqual({
      total: 6,
      confirmed: 4,
      active7: 2, // a et b ; e n'est pas confirmé, il ne compte pas
      new7: 2, // d et f
      staleUnconfirmed: 1, // e
    });
  });

  it("vide sans compte", () => {
    expect(adoptionSummary([], new Set(), NOW)).toEqual({
      total: 0,
      confirmed: 0,
      active7: 0,
      new7: 0,
      staleUnconfirmed: 0,
    });
  });
});

describe("isStaleUnconfirmed", () => {
  it("seulement les comptes jamais confirmés depuis plus de 7 jours", () => {
    expect(isStaleUnconfirmed(account("x", 8, false), NOW)).toBe(true);
    expect(isStaleUnconfirmed(account("x", 6, false), NOW)).toBe(false);
    expect(isStaleUnconfirmed(account("x", 30, true), NOW)).toBe(false);
  });
});

describe("signupsByDay", () => {
  it("compte les inscriptions par jour local, 0 les jours sans", () => {
    const accounts = [
      { ...account("a", 0, true), createdAt: "2026-11-18T09:00:00Z" },
      { ...account("b", 0, true), createdAt: "2026-11-18T10:00:00Z" },
      { ...account("c", 0, true), createdAt: "2026-11-16T23:30:00Z" },
      { ...account("d", 0, true), createdAt: "2026-10-01T10:00:00Z" }, // hors période
    ];
    expect(signupsByDay(accounts, "2026-11-18", 3, "Africa/Dakar")).toEqual([
      { date: "2026-11-16", value: 1 },
      { date: "2026-11-17", value: 0 },
      { date: "2026-11-18", value: 2 },
    ]);
  });
});

describe("adminAccess", () => {
  it("rôle admin et code 2FA saisi : accès", () => {
    expect(adminAccess({ app_metadata: { role: "admin" }, aal: "aal2" })).toBe("granted");
  });

  it("rôle admin sans code 2FA : demande la 2FA", () => {
    expect(adminAccess({ app_metadata: { role: "admin" }, aal: "aal1" })).toBe("needs-2fa");
  });

  it("tout le reste : refusé", () => {
    expect(adminAccess({ app_metadata: { provider: "email" }, aal: "aal2" })).toBe("denied");
    // Le rôle doit venir d'app_metadata (posé par le serveur), jamais de user_metadata.
    expect(
      adminAccess({ app_metadata: {}, aal: "aal2", ...{ user_metadata: { role: "admin" } } }),
    ).toBe("denied");
    expect(adminAccess(null)).toBe("denied");
  });
});
