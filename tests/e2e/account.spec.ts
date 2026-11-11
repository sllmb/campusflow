import { expect, test } from "@playwright/test";

test.describe("suppression de compte : contrôles (compte de test habituel, rien n'est supprimé)", () => {
  test.skip(!process.env.E2E_EMAIL, "E2E_EMAIL et E2E_PASSWORD non définis");

  test("une confirmation mal tapée est refusée", async ({ page }) => {
    await page.goto("/profil", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Supprimer mon compte" }).click();
    await page.getByLabel("Pour confirmer, tape SUPPRIMER").fill("supprime");
    await page.getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page.getByText("Tape SUPPRIMER pour confirmer.")).toBeVisible();
    await page.getByRole("button", { name: "Annuler" }).click();
    await expect(page.getByRole("button", { name: "Supprimer définitivement" })).toHaveCount(0);
  });
});

/**
 * Parcours destructif, uniquement avec un compte JETABLE dédié (E2E_DELETE_EMAIL /
 * E2E_DELETE_PASSWORD) : le compte et ses données sont réellement effacés.
 */
test.describe("suppression de compte : parcours complet (compte jetable)", () => {
  test.skip(!process.env.E2E_DELETE_EMAIL, "E2E_DELETE_EMAIL et E2E_DELETE_PASSWORD non définis");
  test.use({ storageState: { cookies: [], origins: [] } });

  test("le compte et ses données disparaissent, la connexion devient impossible", async ({
    page,
  }) => {
    const email = process.env.E2E_DELETE_EMAIL!;
    const password = process.env.E2E_DELETE_PASSWORD!;
    const login = async () => {
      await page.goto("/login", { waitUntil: "networkidle" });
      await page.getByLabel("E-mail").fill(email);
      await page.getByLabel("Mot de passe").fill(password);
      await page.getByRole("button", { name: "Se connecter" }).click();
    };

    await login();
    await expect(page).toHaveURL(/\/dashboard$/);

    // Des données à effacer : un semestre.
    await page.goto("/matieres", { waitUntil: "networkidle" });
    const open = page.getByRole("button", { name: /Nouveau semestre|Créer mon premier semestre/ });
    if (await open.isVisible()) await open.click();
    await page.getByLabel("Nom", { exact: true }).fill("Semestre à effacer");
    await page.getByLabel("Début").fill("2026-09-01");
    await page.getByLabel("Fin").fill("2027-01-31");
    await page.getByRole("button", { name: "Créer le semestre" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Semestre à effacer" })).toBeVisible();

    await page.goto("/profil", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Supprimer mon compte" }).click();
    await page.getByLabel("Pour confirmer, tape SUPPRIMER").fill("SUPPRIMER");
    await page.getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page).toHaveURL(/\/login\?compte=supprime$/);
    await expect(page.getByRole("status")).toContainText("Ton compte et toutes tes données");

    await login();
    await expect(page.locator("form [role=alert]")).toHaveText("E-mail ou mot de passe incorrect.");
  });
});
