import { expect, test as setup } from "@playwright/test";

const authFile = "tests/e2e/.auth/user.json";

/** Se connecte une fois avec le compte de test et garde la session pour les autres tests. */
setup("connexion du compte de test", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    // Pas de compte de test : session vide, les tests connectés seront ignorés.
    await page.context().storageState({ path: authFile });
    return;
  }
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.context().storageState({ path: authFile });
});
