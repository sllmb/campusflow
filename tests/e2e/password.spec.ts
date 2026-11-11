import { expect, test } from "@playwright/test";

test.describe("mot de passe oublié (sans être connecté)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("le lien depuis la connexion mène au formulaire, qui vérifie l'adresse", async ({
    page,
  }) => {
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Mot de passe oublié ?" }).click();
    await expect(page).toHaveURL(/\/mot-de-passe-oublie$/);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Recevoir le lien" }).click();
    await expect(page.getByText("Indique ton adresse e-mail.")).toBeVisible();
  });

  test("même message, que le compte existe ou non (aucun e-mail n'est envoyé ici)", async ({
    page,
  }) => {
    // Adresse sans compte : Supabase ne l'écrit pas, et la page ne révèle rien.
    const email = `inconnu.${Date.now()}@example.com`;
    await page.goto("/mot-de-passe-oublie", { waitUntil: "networkidle" });
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Recevoir le lien" }).click();
    await expect(page.getByRole("status")).toContainText(`Si un compte existe pour ${email}`);
  });

  test("un lien de réinitialisation invalide renvoie vers la connexion", async ({ page }) => {
    await page.goto("/auth/confirm?token_hash=faux&type=recovery&next=/nouveau-mot-de-passe");
    await expect(page).toHaveURL(/\/login\?erreur=lien$/);
  });

  test("la page « nouveau mot de passe » exige une session", async ({ page }) => {
    await page.goto("/nouveau-mot-de-passe");
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("modifier son mot de passe (connecté)", () => {
  test.skip(!process.env.E2E_EMAIL, "E2E_EMAIL et E2E_PASSWORD non définis");

  test("depuis le profil : contrôles, changement, puis retour à l'ancien", async ({ page }) => {
    const original = process.env.E2E_PASSWORD!;
    const temporary = `${original}-tmp-${Date.now() % 10_000}`;
    const submit = async (password: string, confirm = password) => {
      await page.goto("/nouveau-mot-de-passe", { waitUntil: "networkidle" });
      await page.getByLabel("Nouveau mot de passe").fill(password);
      await page.getByLabel("Confirme le mot de passe").fill(confirm);
      await page.getByRole("button", { name: "Enregistrer" }).click();
    };

    await page.goto("/profil", { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Modifier mon mot de passe" }).click();
    await expect(page).toHaveURL(/\/nouveau-mot-de-passe$/);

    await submit("court");
    await expect(page.getByText("8 caractères minimum.")).toBeVisible();
    await submit(temporary, `${temporary}x`);
    await expect(page.getByText("Les deux mots de passe ne sont pas identiques.")).toBeVisible();
    await submit(original);
    await expect(page.locator("form [role=alert]")).toHaveText(
      "Choisis un mot de passe différent de l'ancien.",
    );

    let changed = false;
    try {
      await submit(temporary);
      await expect(page.getByText("Mot de passe modifié.")).toBeVisible();
      changed = true;
    } finally {
      if (changed) {
        // Toujours remettre le mot de passe du compte de test.
        await submit(original);
        await expect(page.getByText("Mot de passe modifié.")).toBeVisible();
      }
    }
    await page.getByRole("link", { name: "Continuer" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
