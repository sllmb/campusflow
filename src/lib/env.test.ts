import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicEnv } from "./env";

afterEach(() => vi.unstubAllEnvs());

describe("getPublicEnv", () => {
  it.each([
    "https://abc.supabase.co",
    "https://abc.supabase.co/",
    "https://abc.supabase.co/rest/v1/",
    " https://abc.supabase.co/rest/v1 ",
  ])("garde seulement la racine de %j", (url) => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", " sb_publishable_x ");
    expect(getPublicEnv()).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x",
    });
  });

  it("explique quoi faire si une variable manque", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(() => getPublicEnv()).toThrow(/Copiez .env.example en .env.local/);
  });
});
