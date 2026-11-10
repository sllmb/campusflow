import { ArrowRight, Lock, Play, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardLabel, CardValue } from "@/components/ui/card";

/** Aperçu illustratif de l'accueil de l'app (données d'exemple). */
function AppPreview() {
  return (
    <div aria-hidden className="relative grid grid-cols-2 gap-3.5 select-none lg:rotate-[1.5deg]">
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
        <div>
          <CardValue>13,4</CardValue>
          <p className="mt-1 text-[13px] font-semibold">+0,6 ce mois-ci</p>
        </div>
      </Card>
      <Card tone="green" className="flex aspect-square flex-col justify-between p-4">
        <div className="flex items-start justify-between">
          <CardLabel>Pomodoro</CardLabel>
          <span className="flex size-10 items-center justify-center rounded-full border-2 bg-ink text-green">
            <Play className="size-4 fill-current" />
          </span>
        </div>
        <div>
          <CardValue>1h50</CardValue>
          <p className="mt-1 text-[13px] font-semibold">aujourd&apos;hui</p>
        </div>
      </Card>
      <Card className="col-span-2 py-4">
        <div className="flex items-center justify-between">
          <span className="text-base font-extrabold">À venir</span>
          <Badge tone="pink">1 en retard</Badge>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl border-2 bg-green font-extrabold">
            P
          </span>
          <div className="flex-1">
            <p className="text-[15px] font-bold">TP Optique</p>
            <p className="text-[13px] text-ink-soft">Physique</p>
          </div>
          <span className="text-[13px] font-bold">Jeu.</span>
        </div>
      </Card>
    </div>
  );
}

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="grid items-center gap-12 pt-8 pb-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-16 lg:pb-24"
    >
      <div>
        <Badge tone="yellow">Pour les étudiants</Badge>
        <h1
          id="hero-title"
          className="mt-4 text-[44px] leading-[0.98] font-extrabold tracking-[-0.045em] sm:text-6xl lg:text-[68px]"
        >
          Tes cours, tes devoirs, tes notes.{" "}
          <span className="[margin-inline:-0.25rem] bg-[linear-gradient(transparent_60%,var(--yellow)_60%,var(--yellow)_92%,transparent_92%)] box-decoration-clone px-1">
            Au même endroit.
          </span>
        </h1>
        <p className="mt-6 max-w-lg text-lg text-ink-soft">
          CampusFlow te montre ce qui arrive cette semaine, te rappelle ce qui est en retard et
          calcule tes moyennes à ta place.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/signup" size="lg">
            Créer mon compte <ArrowRight />
          </ButtonLink>
          <ButtonLink href="/#comment-ca-marche" variant="outline" size="lg">
            Voir comment ça marche
          </ButtonLink>
        </div>
        <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
          <li className="flex items-center gap-1.5">
            <Lock className="size-4" strokeWidth={2.4} aria-hidden /> Données privées
          </li>
          <li className="flex items-center gap-1.5">
            <Smartphone className="size-4" strokeWidth={2.4} aria-hidden /> Pensé pour le téléphone
          </li>
        </ul>
      </div>
      <AppPreview />
    </section>
  );
}
