import type { Metadata } from "next";
import { Faq } from "@/components/marketing/faq";
import { Features } from "@/components/marketing/features";
import { FinalCta } from "@/components/marketing/final-cta";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Privacy } from "@/components/marketing/privacy";

export const metadata: Metadata = {
  title: { absolute: "CampusFlow · L'organisation de tes études" },
  description:
    "Matières, devoirs, examens, notes et Pomodoro au même endroit. Tes moyennes se calculent toutes seules, et tes données restent privées.",
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Privacy />
      <Faq />
      <FinalCta />
    </>
  );
}
