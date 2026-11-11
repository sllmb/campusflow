import { expect, test, type Page } from "@playwright/test";

/**
 * Parcours complet d'un étudiant, sur un semestre créé pour l'occasion puis supprimé :
 * matières → devoir → notes et moyennes → session de deep work → accueil.
 */
test.skip(!process.env.E2E_EMAIL, "E2E_EMAIL et E2E_PASSWORD non définis");

const SEMESTER = `Semestre E2E ${new Date().toISOString().slice(0, 16).replace("T", " ")}`;

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
}

test("parcours complet : matières, devoir, notes, deep work, accueil", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());

  await test.step("supprimer les semestres de test laissés par un passage interrompu", async () => {
    await page.goto("/matieres");
    await settle(page);
    const leftover = page.getByRole("link", { name: /^Semestre E2E / });
    while ((await leftover.count()) > 0) {
      await leftover.first().click();
      await page.getByRole("button", { name: "Supprimer le semestre" }).click();
      await expect(page).toHaveURL(/\/matieres$/);
      await settle(page);
    }
  });

  await test.step("créer un semestre, une UE et deux matières", async () => {
    await page.goto("/matieres");
    await settle(page);
    const open = page.getByRole("button", { name: /Nouveau semestre|Créer mon premier semestre/ });
    if (await open.isVisible()) await open.click();
    await page.getByLabel("Nom", { exact: true }).fill(SEMESTER);
    const today = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    await page.getByLabel("Début").fill(iso(new Date(today.getTime() - 30 * 86_400_000)));
    await page.getByLabel("Fin").fill(iso(new Date(today.getTime() + 120 * 86_400_000)));
    await page.getByRole("button", { name: "Créer le semestre" }).click();
    await expect(page.getByRole("heading", { level: 1, name: SEMESTER })).toBeVisible();

    await page.getByLabel("Nom de l'UE").fill("UE E2E");
    await page.getByLabel("Crédits ECTS").fill("6");
    await page.getByRole("button", { name: "Ajouter l'UE" }).click();
    const unit = page.getByRole("region", { name: "UE E2E" });
    await expect(unit).toBeVisible();

    for (const [name, coef] of [
      ["Chimie E2E", "2"],
      ["Biologie E2E", "1"],
    ]) {
      await unit.getByRole("button", { name: "Ajouter une matière" }).click();
      await unit.getByLabel("Matière").fill(name);
      await unit.getByLabel("Coefficient").fill(coef);
      await unit.getByRole("button", { name: "Ajouter la matière" }).click();
      await expect(unit.getByText(name, { exact: true })).toBeVisible();
    }
  });

  await test.step("ajouter un devoir pour demain", async () => {
    await page.goto("/devoirs?ajouter=1");
    await page.getByLabel("Titre").fill("Compte rendu E2E");
    await page.getByLabel("Matière", { exact: true }).selectOption({ label: "Chimie E2E" });
    await page.getByRole("button", { name: "Ajouter", exact: true }).click();
    await expect(
      page.getByRole("region", { name: "Demain" }).getByText("Compte rendu E2E"),
    ).toBeVisible();
  });

  await test.step("calendrier : le devoir est sur le bon jour, ajout rapide", async () => {
    const day = (offset: number) => new Date(Date.now() + offset * 86_400_000);
    const iso = (d: Date) =>
      [d.getFullYear(), d.getMonth() + 1, d.getDate()]
        .map((n) => String(n).padStart(2, "0"))
        .join("-");
    const label = (d: Date) =>
      new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(
        d,
      );

    // Vue semaine : le devoir créé pour demain est rangé sous demain.
    await page.goto(`/devoirs/calendrier?vue=semaine&date=${iso(day(1))}`);
    await expect(
      page
        .getByRole("region", { name: new RegExp(label(day(1)), "i") })
        .getByText("Compte rendu E2E"),
    ).toBeVisible();

    // Vue mois : toucher après-demain, puis ajouter une échéance pour ce jour-là.
    await page.goto(`/devoirs/calendrier?vue=mois&date=${iso(day(2))}`);
    await settle(page);
    await page.getByRole("button", { name: /^Ajouter pour le / }).click();
    await page.getByLabel("Titre").fill("Exposé E2E");
    await page.getByLabel("Matière", { exact: true }).selectOption({ label: "Biologie E2E" });
    await page.getByRole("button", { name: "Ajouter", exact: true }).click();
    const selected = page.getByRole("region", { name: new RegExp(label(day(2)), "i") });
    await expect(selected.getByText("Exposé E2E")).toBeVisible();
    await expect(
      page.getByRole("link", { name: new RegExp(`${label(day(2))}.*\\d+ échéance`, "i") }),
    ).toBeVisible();
  });

  await test.step("saisir des notes : moyenne d'UE et validation", async () => {
    await page.goto("/notes");
    await settle(page);
    // Le semestre E2E est le semestre en cours ; s'il y en a plusieurs, on le choisit.
    const tab = page.getByRole("link", { name: SEMESTER });
    if (await tab.isVisible()) await tab.click();
    const unit = page.getByRole("region", { name: "UE E2E" });
    const add = async (subject: string, score: string) => {
      await unit.getByRole("button", { name: `Ajouter une note en ${subject}` }).click();
      await unit.getByLabel("Épreuve").fill("Partiel");
      await unit.getByLabel("Note", { exact: true }).fill(score);
      await unit.getByRole("button", { name: "Ajouter la note" }).click();
      // Formulaire refermé = note enregistrée.
      await expect(unit.getByRole("textbox", { name: "Épreuve" })).toHaveCount(0);
    };
    await add("Chimie E2E", "12");
    await add("Biologie E2E", "7");
    // (12 × 2 + 7 × 1) / 3 = 10,33 : UE validée par compensation.
    await expect(unit.locator("p.tabular-nums").first()).toHaveText("10,33");
    await expect(unit.getByText("Validée", { exact: true })).toBeVisible();
    await expect(page.getByText("Semestre validé")).toBeVisible();
  });

  await test.step("deep work de durée libre (2 h), chronométré avec une horloge simulée", async () => {
    // Horloge avancée de 2 h : la session se termine juste avant « maintenant » côté serveur.
    await page.clock.install({ time: Date.now() - 121 * 60_000 });
    await page.goto("/pomodoro", { waitUntil: "networkidle" });
    await page.getByRole("radio", { name: /Deep work/ }).check({ force: true });
    // Durée libre : + et − par quarts d'heure, raccourcis en un geste.
    const duration = page.getByRole("group", { name: "Durée du deep work" });
    await duration.getByRole("button", { name: "Ajouter 15 minutes" }).click();
    await expect(duration.locator("output")).toHaveText("2 h 15");
    await duration.getByRole("button", { name: "6 h", exact: true }).click();
    await expect(duration.locator("output")).toHaveText("6 h");
    await duration.getByRole("button", { name: "2 h", exact: true }).click();
    await expect(page.getByRole("radio", { name: /Deep work\s*2 h/ })).toBeChecked();
    await page.getByLabel("Matière (facultatif)").selectOption({ label: "Chimie E2E" });
    await page.getByRole("button", { name: "Démarrer" }).click();
    await expect(page.getByRole("timer")).toHaveText(/^1:59:5\d$/);
    await page.clock.fastForward("02:00:05");
    await expect(page.getByRole("status").filter({ hasText: "Session" })).toHaveText(
      "Session enregistrée : 2 h en Chimie E2E.",
    );
  });

  await test.step("l'accueil reflète tout", async () => {
    await page.goto("/dashboard");
    await settle(page);
    await expect(page.getByText("Compte rendu E2E").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Pomodoro .*aujourd/ })).toContainText(/\d+ h/);
  });

  await test.step("statistiques : temps par matière et régularité", async () => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: /Mes statistiques/ }).click();
    await expect(page).toHaveURL(/\/statistiques$/);
    await expect(page.getByRole("heading", { name: "Temps de concentration" })).toBeVisible();
    // Le deep work de 2 h en Chimie E2E apparaît dans la répartition par matière.
    const chimie = page.getByRole("listitem").filter({ hasText: "Chimie E2E" });
    await expect(chimie).toContainText("2 h");
    await expect(page.getByText(/jours? d'affilée avec au moins une session/)).toBeVisible();
    await page.getByRole("link", { name: "30 jours" }).click();
    await expect(page).toHaveURL(/periode=30/);
    await expect(page.getByText("Les 30 derniers jours")).toBeVisible();
  });

  await test.step("nettoyage : supprimer la session et le semestre de test", async () => {
    await page.goto("/pomodoro");
    await settle(page);
    const session = page
      .getByRole("listitem")
      .filter({ hasText: "Sans matière" })
      .or(page.getByRole("listitem").filter({ hasText: "Chimie E2E" }));
    while ((await session.count()) > 0) {
      const count = await session.count();
      await session.first().getByRole("button", { name: "Supprimer la session" }).click();
      await expect(session).toHaveCount(count - 1);
    }
    await page.goto("/matieres");
    await settle(page);
    await page.getByRole("link", { name: new RegExp(SEMESTER) }).click();
    await page.getByRole("button", { name: "Supprimer le semestre" }).click();
    await expect(page).toHaveURL(/\/matieres$/);
    // Rôle « lien » : ignore la copie cachée de la page précédente que Next.js garde en mémoire.
    await expect(page.getByRole("link", { name: new RegExp(SEMESTER) })).toHaveCount(0);
  });
});
