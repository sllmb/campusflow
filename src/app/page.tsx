import type { Metadata } from "next";
import { ArrowRight, BookOpen, ClipboardList, GraduationCap, Play, Timer } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardLabel, CardValue } from "@/components/ui/card";

export const metadata: Metadata = {
  title: { absolute: "CampusFlow · L'organisation de tes études" },
};

const features: {
  icon: typeof BookOpen;
  iconBg: string;
  title: string;
  text: string;
}[] = [
  {
    icon: BookOpen,
    iconBg: "bg-blue",
    title: "Tes matières",
    text: "Chaque matière a sa couleur et son coefficient. Tout le reste s'y rattache.",
  },
  {
    icon: ClipboardList,
    iconBg: "bg-pink",
    title: "Tes échéances",
    text: "Devoirs, projets et examens triés par date. Les retards sautent aux yeux.",
  },
  {
    icon: GraduationCap,
    iconBg: "bg-yellow",
    title: "Tes moyennes",
    text: "Saisis tes notes : les moyennes avec coefficients se calculent toutes seules.",
  },
  {
    icon: Timer,
    iconBg: "bg-green",
    title: "Ton focus",
    text: "Un Pomodoro intégré, avec le temps de travail enregistré par matière.",
  },
];

/** Aperçu illustratif de l'accueil de l'app (données d'exemple). */
function AppPreview() {
  return (
    <div aria-hidden className="grid grid-cols-2 gap-3.5 select-none">
      <Card tone="blue" className="col-span-2">
        <div className="flex items-center justify-between gap-2">
          <Badge>Mathématiques</Badge>
          <Badge tone="dark">Demain 23:59</Badge>
        </div>
        <p className="mt-4 text-sm font-semibold">Prochain rendu</p>
        <p className="text-[28px] leading-[1.05] font-extrabold tracking-[-0.03em]">
          DM Probabilités
        </p>
        <div className="mt-3 flex gap-1.5">
          {[true, true, true, false].map((done, i) => (
            <span
              key={i}
              className={`h-2.5 flex-1 rounded-full border-2 ${done ? "bg-ink" : "bg-surface"}`}
            />
          ))}
        </div>
      </Card>
      <Card tone="yellow" className="flex aspect-square flex-col justify-between p-4">
        <CardLabel>Moyenne</CardLabel>
        <CardValue>13,4</CardValue>
      </Card>
      <Card tone="green" className="flex aspect-square flex-col justify-between p-4">
        <div className="flex items-start justify-between">
          <CardLabel>Pomodoro</CardLabel>
          <span className="flex size-10 items-center justify-center rounded-full border-2 bg-ink text-green">
            <Play className="size-4 fill-current" />
          </span>
        </div>
        <CardValue>1h50</CardValue>
      </Card>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-[18px] lg:px-10">
      <header className="flex items-center justify-between gap-4 py-6">
        <Logo href="/" />
        <ButtonLink href="/login" variant="outline" size="sm">
          Se connecter
        </ButtonLink>
      </header>

      <main className="flex-1">
        <section className="grid items-center gap-10 pt-6 pb-14 lg:grid-cols-2 lg:gap-16 lg:pt-14 lg:pb-20">
          <div>
            <Badge tone="yellow">Pour les étudiants</Badge>
            <h1 className="mt-4 text-[44px] leading-[0.98] font-extrabold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Tes cours, tes devoirs, tes notes. Au même endroit.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-ink-soft">
              CampusFlow t&apos;aide à voir ce qui arrive, à ne plus rater d&apos;échéance et à
              suivre tes moyennes, sur ton téléphone comme sur ton ordi.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/signup" size="lg">
                Créer mon compte <ArrowRight />
              </ButtonLink>
              <ButtonLink href="/login" variant="outline" size="lg">
                J&apos;ai déjà un compte
              </ButtonLink>
            </div>
            <p className="mt-4 text-sm font-semibold">
              Tes données restent privées : toi seul y as accès.
            </p>
          </div>
          <AppPreview />
        </section>

        <section aria-labelledby="features-title" className="pb-16 lg:pb-24">
          <h2
            id="features-title"
            className="text-3xl font-extrabold tracking-[-0.03em] lg:text-4xl"
          >
            Tout ce qu&apos;il faut pour ton semestre
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, iconBg, title, text }) => (
              <Card key={title}>
                <span
                  className={`flex size-12 items-center justify-center rounded-2xl border-2 ${iconBg}`}
                >
                  <Icon className="size-6" strokeWidth={2.2} aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-extrabold tracking-tight">{title}</h3>
                <p className="mt-1 text-[15px] text-ink-soft">{text}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="pb-16 lg:pb-24">
          <Card
            tone="yellow"
            className="flex flex-col items-start gap-5 p-7 lg:flex-row lg:items-center lg:justify-between lg:p-10"
          >
            <div>
              <h2 className="text-3xl font-extrabold tracking-[-0.03em]">
                Prêt pour ce semestre ?
              </h2>
              <p className="mt-1 text-[15px] font-semibold">Ton compte est prêt en une minute.</p>
            </div>
            <ButtonLink href="/signup" variant="dark" size="lg">
              Créer mon compte <ArrowRight />
            </ButtonLink>
          </Card>
        </section>
      </main>

      <footer className="border-t-2 py-6 text-sm font-semibold">CampusFlow</footer>
    </div>
  );
}
