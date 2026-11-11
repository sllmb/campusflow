import { expect, test } from "@playwright/test";

test("le manifeste décrit une app installable", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest).toMatchObject({
    name: "CampusFlow",
    display: "standalone",
    start_url: "/dashboard",
  });
  for (const icon of manifest.icons) {
    expect((await request.get(icon.src)).ok(), icon.src).toBe(true);
  }
});

test.describe("hors connexion", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("sans réseau, une page « Pas de connexion » s'affiche, avec son style", async ({
    page,
    context,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // Attendre que le service worker soit installé et contrôle la page.
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload({ waitUntil: "networkidle" });
    await expect
      .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
      .toBe(true);

    await context.setOffline(true);
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Pas de connexion" })).toBeVisible();
    // Feuille de style servie depuis le cache : fond crème de l'app.
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(background).toBe("rgb(246, 244, 236)");
    await context.setOffline(false);
  });
});

test.describe("connecté", () => {
  test.skip(!process.env.E2E_EMAIL, "E2E_EMAIL et E2E_PASSWORD non définis");

  test("aucune page contenant des données n'est mise en cache", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    for (const path of ["/dashboard", "/notes", "/devoirs"]) {
      await page.goto(path, { waitUntil: "networkidle" });
    }
    const cached = await page.evaluate(async () => {
      const urls: string[] = [];
      for (const name of await caches.keys()) {
        const cache = await caches.open(name);
        for (const request of await cache.keys()) urls.push(new URL(request.url).pathname);
      }
      return urls;
    });
    expect(cached).toContain("/offline");
    const personal = cached.filter(
      (path) =>
        !path.startsWith("/_next/static/") &&
        !path.startsWith("/brand/") &&
        !["/offline", "/icon.svg"].includes(path),
    );
    expect(personal).toEqual([]);
  });

  test("sur iPhone, l'accueil explique comment installer l'app, et l'aide se masque", async ({
    page,
  }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    const hint = page.getByRole("region", { name: "Installer l'application" });
    await expect(hint).toContainText("Sur l'écran d'accueil");
    await hint.getByRole("button", { name: "Masquer" }).click();
    await expect(hint).toHaveCount(0);
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByRole("region", { name: "Installer l'application" })).toHaveCount(0);
  });
});
