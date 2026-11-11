import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-redirect";

describe("safeNext : chemin de retour sûr", () => {
  it.each([
    ["/dashboard", "/dashboard"],
    ["/nouveau-mot-de-passe", "/nouveau-mot-de-passe"],
    ["/devoirs?ajouter=1", "/devoirs?ajouter=1"],
  ])("accepte une page de l'app : %s", (next, expected) => {
    expect(safeNext(next)).toBe(expected);
  });

  it.each([
    null,
    "",
    "dashboard",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/\\\\evil.example",
    "/%0d%0a//evil.example".replace("%0d%0a", "\r\n"),
    "javascript:alert(1)",
  ])("refuse %j et renvoie l'accueil", (next) => {
    expect(safeNext(next)).toBe("/dashboard");
  });

  it("utilise la page de repli fournie", () => {
    expect(safeNext("//evil.example", "/login")).toBe("/login");
  });
});
