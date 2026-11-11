import { expect, test } from "@playwright/test";

test("en-têtes de sécurité sur les pages publiques", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["content-security-policy"]).toContain("object-src 'none'");
});

test("le rappel du matin refuse tout appel sans le secret de Vercel Cron", async ({ request }) => {
  const attempts: Record<string, string>[] = [
    {},
    { authorization: "Bearer mauvais-secret" },
    { authorization: "" },
  ];
  for (const headers of attempts) {
    const response = await request.get("/api/rappels", { headers, maxRedirects: 0 });
    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: "Non autorisé." });
  }
});

test.describe("pages personnelles", () => {
  test.skip(!process.env.E2E_EMAIL, "E2E_EMAIL et E2E_PASSWORD non définis");

  test("jamais gardées par un cache partagé", async ({ page }) => {
    for (const path of ["/dashboard", "/notes", "/devoirs", "/profil"]) {
      const response = await page.goto(path);
      expect(response?.headers()["cache-control"], path).toContain("private");
      expect(response?.headers()["cache-control"], path).toContain("no-store");
    }
  });
});
