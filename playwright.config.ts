import { defineConfig, devices } from "@playwright/test";

/**
 * Tests de bout en bout.
 *
 *   npm run build && npm run e2e
 *
 * Les tests « connectés » ont besoin d'un compte de test confirmé, passé par variables
 * d'environnement (jamais dans le code) : E2E_EMAIL et E2E_PASSWORD. Sans elles, ils sont
 * ignorés et seuls les tests publics tournent.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  // Les réponses passent par Supabase : marge pour un réseau lent.
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
    trace: "off",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "mobile",
      use: {
        // Écran et tactile d'un iPhone 13, avec Chromium (le seul navigateur requis).
        ...devices["iPhone 13"],
        browserName: "chromium",
        storageState: "tests/e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run start",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
