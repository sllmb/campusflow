import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("getReminderSecrets", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("retire les espaces et retours à la ligne glissés par un copier-coller", async () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", " sb_secret_abc\n def \r\n");
    vi.stubEnv("VAPID_PRIVATE_KEY", "cle\tprivee");
    vi.stubEnv("CRON_SECRET", "  ");
    const { getReminderSecrets } = await import("./push");
    expect(getReminderSecrets()).toEqual({
      supabaseSecretKey: "sb_secret_abcdef",
      vapidPrivateKey: "cleprivee",
      cronSecret: undefined,
    });
  });
});
