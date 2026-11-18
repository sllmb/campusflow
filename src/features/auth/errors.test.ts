import { describe, expect, it } from "vitest";
import { authErrorMessage, CAPTCHA_MESSAGE } from "./errors";

describe("authErrorMessage", () => {
  it("traduit le refus de l'anti-robots, par son code ou par son message", () => {
    expect(authErrorMessage({ code: "captcha_failed", message: "" })).toBe(CAPTCHA_MESSAGE);
    expect(
      authErrorMessage({
        code: undefined,
        message: "captcha protection: request disallowed (no captcha_token found)",
      }),
    ).toBe(CAPTCHA_MESSAGE);
  });

  it("garde les messages connus et un message général pour le reste", () => {
    expect(authErrorMessage({ code: "invalid_credentials", message: "" })).toBe(
      "E-mail ou mot de passe incorrect.",
    );
    expect(authErrorMessage({ code: "unexpected_failure", message: "boom" })).toBe(
      "Une erreur est survenue. Réessaie dans un instant.",
    );
  });
});
