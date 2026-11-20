import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Plan du site : les pages publiques. */
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/signup", "/login", "/mentions-legales", "/confidentialite"].map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.5,
  }));
}
