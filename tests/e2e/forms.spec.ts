import { devices, expect, test, type Page } from "@playwright/test";
import { nextTotp, totp } from "./totp";

/**
 * Formulaires de bout en bout, avec deux personnes : l'admin crée et publie un questionnaire,
 * l'étudiant le voit sur son accueil et y répond une fois, l'admin voit la réponse arriver.
 * Il faut un compte admin sur le projet de TEST (E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD) ; sa 2FA
 * est activée pendant le test puis désactivée.
 */
test.skip(
  !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_EMAIL,
  "E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD et le compte étudiant sont nécessaires",
);

const TITLE = `Questionnaire E2E ${new Date().toISOString().slice(0, 16).replace("T", " ")}`;
const phone = { ...devices["iPhone 13"], browserName: undefined };

async function loginAdmin(page: Page) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("E-mail").fill(process.env.E2E_ADMIN_EMAIL!);
  await page.getByLabel("Mot de passe").fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

test("l'admin publie un questionnaire, l'étudiant y répond une fois", async ({ browser }) => {
  const adminContext = await browser.newContext({ ...phone, storageState: undefined });
  const admin = await adminContext.newPage();
  admin.on("dialog", (dialog) => dialog.accept());
  const studentContext = await browser.newContext({
    ...phone,
    storageState: "tests/e2e/.auth/user.json",
  });
  const student = await studentContext.newPage();
  let secret: string | null = null;
  let lastCode = "";

  try {
    await test.step("l'admin arrive sur son espace, sans les pages d'étudiant", async () => {
      await loginAdmin(admin);
      await expect(admin).toHaveURL(/\/admin$/);
      await expect(admin.getByRole("link", { name: "Formulaires" }).first()).toBeVisible();
      await expect(admin.getByRole("link", { name: "Matières" })).toHaveCount(0);
      await admin.goto("/notes");
      await expect(admin).toHaveURL(/\/admin$/);
    });

    await test.step("sans code 2FA, l'espace admin reste fermé ; on l'active", async () => {
      await admin.goto("/admin/formulaires");
      await expect(admin.getByText("Double authentification requise")).toBeVisible();
      await admin.goto("/profil", { waitUntil: "networkidle" });
      await admin.getByRole("button", { name: "Activer la double authentification" }).click();
      const key = admin.locator("code");
      await expect(key).toBeVisible();
      secret = (await key.innerText()).replace(/\s/g, "");
      lastCode = totp(secret);
      await admin.getByLabel("Code à 6 chiffres").fill(lastCode);
      await admin.getByRole("button", { name: "Activer", exact: true }).click();
      await expect(admin.getByText("Double authentification activée.")).toBeVisible();
    });

    await test.step("créer le questionnaire, ses questions, et le publier", async () => {
      await admin.goto("/admin/formulaires", { waitUntil: "networkidle" });
      await admin.getByRole("button", { name: "Nouveau formulaire" }).click();
      await admin.getByLabel("Titre").fill(TITLE);
      await admin.getByRole("button", { name: "Créer le formulaire" }).click();
      await expect(admin.getByRole("heading", { level: 1, name: TITLE })).toBeVisible();
      // Sans question, impossible de publier.
      await expect(admin.getByRole("button", { name: "Publier" })).toBeDisabled();

      await admin.getByRole("button", { name: "Ajouter une question" }).click();
      await admin
        .getByRole("textbox", { name: "Question", exact: true })
        .fill("Ton année d'études");
      await admin.getByLabel("Type de réponse").selectOption({ label: "Choix unique" });
      await admin.getByLabel("Choix proposés (un par ligne)").fill("L1\nL2\nL3");
      await admin.getByLabel("Réponse obligatoire").check();
      await admin.getByRole("button", { name: "Ajouter la question" }).click();
      await expect(admin.getByText("Ton année d'études")).toBeVisible();

      await admin.getByRole("button", { name: "Ajouter une question" }).click();
      await admin
        .getByRole("textbox", { name: "Question", exact: true })
        .fill("Recommanderais-tu CampusFlow ?");
      await admin.getByLabel("Type de réponse").selectOption({ label: "Échelle de 1 à 5" });
      await admin.getByRole("button", { name: "Ajouter la question" }).click();
      await expect(admin.getByText("Recommanderais-tu CampusFlow ?")).toBeVisible();

      // Réordonner : l'échelle passe en premier.
      await admin.getByRole("button", { name: "Monter la question 2" }).click();
      await expect(admin.getByRole("listitem").filter({ hasText: "1." }).first()).toContainText(
        "Recommanderais-tu",
      );

      await admin.getByRole("button", { name: "Publier" }).click();
      await expect(admin.getByText("Ouvert", { exact: true })).toBeVisible();
    });

    await test.step("l'étudiant le voit sur son accueil et y répond", async () => {
      await student.goto("/dashboard", { waitUntil: "networkidle" });
      const card = student.getByText("Un questionnaire t'attend").locator("../..");
      await expect(card).toContainText(TITLE);
      await card.getByRole("link", { name: "Répondre" }).click();
      await expect(student.getByRole("heading", { level: 1, name: TITLE })).toBeVisible();
      await expect(student.getByText("Questionnaire anonyme")).toBeVisible();

      // La question obligatoire est vérifiée par le serveur.
      await student.getByRole("button", { name: "Envoyer mes réponses" }).click();
      await expect(student.getByText("Réponse obligatoire.")).toBeVisible();

      await student.getByRole("radio", { name: "4" }).check({ force: true });
      await student.getByRole("radio", { name: "L2" }).check();
      await student.getByRole("button", { name: "Envoyer mes réponses" }).click();
      await expect(student.getByText("Merci pour tes réponses !")).toBeVisible();

      // Une seule réponse par personne, et la carte disparaît de l'accueil.
      await student.reload({ waitUntil: "networkidle" });
      await expect(student.getByText("Une seule réponse par personne.")).toBeVisible();
      await expect(student.getByRole("button", { name: "Envoyer mes réponses" })).toHaveCount(0);
      await student.goto("/dashboard", { waitUntil: "networkidle" });
      await expect(student.getByText(TITLE)).toHaveCount(0);
    });

    await test.step("l'admin voit la réponse ; les questions sont verrouillées", async () => {
      await admin.reload({ waitUntil: "networkidle" });
      await expect(admin.getByText("1 réponse", { exact: true })).toBeVisible();
      await expect(admin.getByText("les questions ne peuvent plus changer")).toBeVisible();
      await expect(admin.getByRole("button", { name: "Ajouter une question" })).toHaveCount(0);
      // Résultats : barres pour les choix, moyenne pour l'échelle, export CSV.
      const editorUrl = admin.url();
      await admin.getByRole("link", { name: "Résultats" }).click();
      await expect(admin.getByRole("heading", { level: 1, name: TITLE })).toBeVisible();
      const annee = admin.getByRole("listitem").filter({ hasText: /^L2/ });
      await expect(annee).toContainText("1 personne");
      await expect(annee).toContainText("100 %");
      await expect(admin.getByText("Moyenne :")).toContainText("4");
      const [download] = await Promise.all([
        admin.waitForEvent("download"),
        admin.getByRole("link", { name: "Exporter en CSV" }).click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/^questionnaire-e2e-.*-reponses\.csv$/);
      const csv = (await (await download.createReadStream()).toArray()).join("");
      const lines = csv
        .replace(/^\uFEFF/, "")
        .trim()
        .split("\r\n");
      expect(lines[0]).toBe("Date;Recommanderais-tu CampusFlow ?;Ton année d'études");
      expect(lines[1]).toMatch(/;4;L2$/);
      expect(lines).toHaveLength(2);
      await admin.goto(editorUrl, { waitUntil: "networkidle" });

      await admin.getByRole("button", { name: "Fermer les réponses" }).click();
      await expect(admin.getByText("Fermé", { exact: true })).toBeVisible();
    });

    await test.step("fermé : l'étudiant ne peut plus l'ouvrir", async () => {
      // La RLS ne laisse plus lire le formulaire : page « Introuvable », sans les questions.
      await student.goto(admin.url().replace("/admin/formulaires", "/questionnaires"));
      await expect(student.getByRole("heading", { name: "Introuvable" })).toBeVisible();
      await expect(student.getByText(TITLE)).toHaveCount(0);
    });
  } finally {
    await test.step("nettoyage : supprimer le questionnaire, retirer la 2FA de l'admin", async () => {
      await admin.goto("/admin/formulaires", { waitUntil: "networkidle" });
      const leftover = admin.getByRole("link", { name: new RegExp(TITLE) });
      if (await leftover.count()) {
        await leftover.first().click();
        await admin.getByRole("button", { name: "Supprimer le formulaire" }).click();
        await expect(admin).toHaveURL(/\/admin\/formulaires$/);
      }
      await admin.goto("/profil", { waitUntil: "networkidle" });
      if (admin.url().includes("/verification") && secret) {
        lastCode = await nextTotp(secret, lastCode);
        await admin.getByLabel("Code à 6 chiffres").fill(lastCode);
        await admin.getByRole("button", { name: "Vérifier" }).click();
        await admin.waitForLoadState("networkidle");
      }
      const disable = admin.getByRole("button", { name: "Désactiver", exact: true });
      if (await disable.isVisible()) {
        await disable.click();
        await expect(admin.getByText("Double authentification désactivée.")).toBeVisible();
      }
      await adminContext.close();
      await studentContext.close();
    });
  }
});
