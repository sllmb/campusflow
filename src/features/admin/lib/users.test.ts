import { describe, expect, it } from "vitest";
import { canManage, filterUserRows, parseUserFilter, toUserRows, type AuthUserLike } from "./users";

const NOW = new Date("2026-11-18T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();

const users: AuthUserLike[] = [
  {
    id: "awa",
    email: "awa@esp.sn",
    created_at: daysAgo(20),
    email_confirmed_at: daysAgo(20),
    last_sign_in_at: daysAgo(1),
    factors: [{ status: "verified" }],
  },
  {
    id: "moussa",
    email: "moussa@gmail.com",
    created_at: daysAgo(3),
    email_confirmed_at: null,
  },
  {
    id: "robot",
    email: "robot@spam.test",
    created_at: daysAgo(30),
    email_confirmed_at: daysAgo(30),
    last_sign_in_at: daysAgo(29),
    banned_until: "2126-01-01T00:00:00Z",
  },
  {
    id: "admin",
    email: "campusflow.contact@gmail.com",
    created_at: daysAgo(10),
    email_confirmed_at: daysAgo(10),
    app_metadata: { role: "admin" },
    factors: [{ status: "unverified" }],
  },
];

const rows = toUserRows(users, {
  names: new Map([
    ["awa", "Awa"],
    ["moussa", "Moussa Fall"],
  ]),
  subscribers: new Set(["awa"]),
  activeIds: new Set(["moussa"]),
  now: NOW,
});

describe("toUserRows", () => {
  it("une ligne par compte, les plus récents d'abord", () => {
    expect(rows.map((row) => row.id)).toEqual(["moussa", "admin", "awa", "robot"]);
  });

  it("calcule l'état de chaque compte", () => {
    const awa = rows.find((row) => row.id === "awa")!;
    expect(awa).toMatchObject({
      name: "Awa",
      confirmed: true,
      twoFactor: true,
      reminders: true,
      activeThisWeek: true, // connectée hier
      suspended: false,
      isAdmin: false,
    });
    const admin = rows.find((row) => row.id === "admin")!;
    expect(admin).toMatchObject({ isAdmin: true, twoFactor: false, name: "" });
    expect(rows.find((row) => row.id === "robot")!.suspended).toBe(true);
    expect(rows.find((row) => row.id === "moussa")!).toMatchObject({
      confirmed: false,
      activeThisWeek: true, // a écrit quelque chose cette semaine
    });
  });

  it("une suspension terminée ne compte plus", () => {
    const [row] = toUserRows([{ ...users[2], banned_until: daysAgo(1) }], {
      names: new Map(),
      subscribers: new Set(),
      activeIds: new Set(),
      now: NOW,
    });
    expect(row.suspended).toBe(false);
  });
});

describe("filterUserRows", () => {
  it("cherche dans l'e-mail et le prénom, sans majuscules ni accents", () => {
    expect(filterUserRows(rows, "FALL", "tous").map((r) => r.id)).toEqual(["moussa"]);
    expect(filterUserRows(rows, "esp.sn", "tous").map((r) => r.id)).toEqual(["awa"]);
    const withAccent = rows.map((row) => (row.id === "awa" ? { ...row, name: "Aïssatou" } : row));
    expect(filterUserRows(withAccent, "aissatou", "tous").map((r) => r.id)).toEqual(["awa"]);
  });

  it("filtre par état", () => {
    expect(filterUserRows(rows, "", "actifs").map((r) => r.id)).toEqual(["awa"]);
    expect(filterUserRows(rows, "", "non-confirmes").map((r) => r.id)).toEqual(["moussa"]);
    expect(filterUserRows(rows, "", "suspendus").map((r) => r.id)).toEqual(["robot"]);
    expect(filterUserRows(rows, "  ", "tous")).toHaveLength(4);
  });

  it("filtre inconnu dans l'adresse : tous", () => {
    expect(parseUserFilter("n'importe quoi")).toBe("tous");
    expect(parseUserFilter("suspendus")).toBe("suspendus");
  });
});

describe("canManage", () => {
  it("jamais soi-même ni un autre admin", () => {
    expect(canManage({ id: "awa", isAdmin: false }, "admin")).toBe(true);
    expect(canManage({ id: "admin", isAdmin: true }, "admin")).toBe(false);
    expect(canManage({ id: "autre-admin", isAdmin: true }, "admin")).toBe(false);
  });
});
