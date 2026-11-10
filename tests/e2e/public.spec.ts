import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("la page d'accueil présente CampusFlow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Au même endroit");
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await page
    .getByRole("navigation", { name: "Navigation du site (mobile)" })
    .getByRole("link", { name: "FAQ" })
    .click();
  await expect(page).toHaveURL(/#faq$/);
  await page.getByText("Qui peut voir mes notes ?").click();
  await expect(page.getByText("Toi seul.")).toBeVisible();
});

test("les pages de l'app exigent une connexion", async ({ page }) => {
  for (const path of ["/dashboard", "/matieres", "/devoirs", "/notes", "/pomodoro", "/profil"]) {
    await page.goto(path);
    await expect(page, `${path} doit renvoyer vers /login`).toHaveURL(/\/login$/);
  }
});

test("les pages légales sont publiques", async ({ page }) => {
  await page.goto("/confidentialite");
  await expect(page.getByRole("heading", { level: 1, name: "Confidentialité" })).toBeVisible();
  await page.goto("/mentions-legales");
  await expect(page.getByRole("heading", { level: 1, name: "Mentions légales" })).toBeVisible();
});

test("de faux identifiants sont refusés avec un message clair", async ({ page }) => {
  // Attendre que la page soit interactive, comme un utilisateur qui voit le formulaire.
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("E-mail").fill("personne@example.com");
  await page.getByLabel("Mot de passe").fill("mauvais-mot-de-passe");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.locator("form [role=alert]")).toHaveText("E-mail ou mot de passe incorrect.");
});

test("l'inscription vérifie les champs", async ({ page }) => {
  await page.goto("/signup", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByText("Indique ton prénom.")).toBeVisible();
  await expect(page.getByText("8 caractères minimum.")).toBeVisible();
});
