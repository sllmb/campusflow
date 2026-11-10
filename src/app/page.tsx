import type { Metadata } from "next";
import { Faq } from "@/components/marketing/faq";
import { Features } from "@/components/marketing/features";
import { FinalCta } from "@/components/marketing/final-cta";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Privacy } from "@/components/marketing/privacy";
import { SiteHeader } from "@/components/marketing/site-header";
import { SkipLink } from "@/components/marketing/skip-link";

export const metadata: Metadata = {
  title: { absolute: "CampusFlow · L'organisation de tes études" },
  description:
    "Matières, devoirs, examens, notes et Pomodoro au même endroit. Tes moyennes se calculent toutes seules, et tes données restent privées.",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <SiteHeader />
      <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-[18px] lg:px-10">
        <Hero />
        <Features />
        <HowItWorks />
        <Privacy />
        <Faq />
        <FinalCta />
      </main>
      <footer className="mx-auto w-full max-w-6xl border-t-2 px-[18px] py-6 text-sm font-semibold lg:px-10">
        CampusFlow
      </footer>
    </div>
  );
}
