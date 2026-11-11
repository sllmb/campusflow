import { expect, test, type Page } from "@playwright/test";
import { nextTotp, totp } from "./totp";

/**
 * Double authentification de bout en bout : activation, connexion avec code, accès bloqué
 * sans code, désactivation. Le compte de test est toujours remis sans 2FA à la fin.
 */
test.skip(!process.env.E2E_EMAIL, "E2E_EMAIL et E2E_PASSWORD non définis");

async function login(page: Page) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("E-mail").fill(process.env.E2E_EMAIL!);
  await page.getByLabel("Mot de passe").fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

test("activer la 2FA, se connecter avec le code, puis la désactiver", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
  let secret: string | null = null;
  let lastCode = "";

  try {
    await test.step("activer depuis le profil", async () => {
      await page.goto("/profil", { waitUntil: "networkidle" });
      await page.getByRole("button", { name: "Activer la double authentification" }).click();
      const key = page.locator("code");
      await expect(key).toBeVisible();
      secret = (await key.innerText()).replace(/\s/g, "");
      lastCode = totp(secret);
      await page.getByLabel("Code à 6 chiffres").fill(lastCode);
      await page.getByRole("button", { name: "Activer", exact: true }).click();
      await expect(page.getByText("Double authentification activée.")).toBeVisible();
    });

    await test.step("se reconnecter : le code est demandé", async () => {
      await page.goto("/profil", { waitUntil: "networkidle" });
      await page.getByRole("button", { name: "Se déconnecter" }).click();
      await expect(page).toHaveURL(/\/login$/);
      await login(page);
      await expect(page).toHaveURL(/\/verification$/);
      // Sans code, l'app reste fermée.
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/verification\?next=%2Fdashboard$/);
      // La page demandée est mémorisée (ex. : lien de réinitialisation du mot de passe).
      await page.goto("/nouveau-mot-de-passe");
      await expect(page).toHaveURL(/\/verification\?next=%2Fnouveau-mot-de-passe$/);
    });

    await test.step("un mauvais code est refusé, le bon ramène à la page demandée", async () => {
      await page.waitForLoadState("networkidle");
      await page.getByLabel("Code à 6 chiffres").fill(lastCode === "000000" ? "111111" : "000000");
      await page.getByRole("button", { name: "Vérifier" }).click();
      await expect(page.locator("form [role=alert]")).toContainText("Code incorrect");
      lastCode = await nextTotp(secret!, lastCode);
      await page.getByLabel("Code à 6 chiffres").fill(lastCode);
      await page.getByRole("button", { name: "Vérifier" }).click();
      // Retour sur la page demandée avant le code.
      await expect(page).toHaveURL(/\/nouveau-mot-de-passe$/);
    });
  } finally {
    await test.step("remettre le compte de test sans 2FA", async () => {
      await page.goto("/profil", { waitUntil: "networkidle" });
      if (page.url().includes("/verification") && secret) {
        lastCode = await nextTotp(secret, lastCode);
        await page.getByLabel("Code à 6 chiffres").fill(lastCode);
        await page.getByRole("button", { name: "Vérifier" }).click();
        await expect(page).toHaveURL(/\/profil$/);
        await page.waitForLoadState("networkidle");
      }
      const disable = page.getByRole("button", { name: "Désactiver", exact: true });
      if (await disable.isVisible()) {
        await disable.click();
        await expect(page.getByText("Double authentification désactivée.")).toBeVisible();
      }
    });
  }
});
