import type { Metadata } from "next";
import { Play, Plus } from "lucide-react";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardLabel, CardTitle, CardValue } from "@/components/ui/card";
import { Greeting } from "@/features/profile/components/greeting";
import { AvatarLink, UserAvatar } from "@/features/profile/components/user-avatar";

export const metadata: Metadata = { title: "Accueil" };

/*
 * Structure de l'accueil. Les données réelles arrivent à l'étape 7 (dashboard) :
 * en attendant, chaque widget affiche son état vide.
 */
export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title={
          <Suspense fallback="Salut !">
            <Greeting />
          </Suspense>
        }
        description="Voici ta semaine en un coup d'œil."
        action={
          <div className="flex gap-3">
            <Button size="icon" aria-label="Ajouter">
              <Plus strokeWidth={2.6} />
            </Button>
            <Suspense fallback={<AvatarLink />}>
              <UserAvatar />
            </Suspense>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4 lg:gap-5">
        <Card tone="blue" className="col-span-2">
          <Badge>Prochain rendu</Badge>
          <p className="mt-5 text-[28px] leading-[1.05] font-extrabold tracking-[-0.03em] lg:text-[34px]">
            Rien à rendre pour l&apos;instant
          </p>
          <p className="mt-2 text-sm font-semibold">
            Ajoute un devoir et il apparaîtra ici avec son échéance.
          </p>
        </Card>

        <Card
          tone="yellow"
          className="flex aspect-square flex-col justify-between p-4 lg:aspect-auto lg:p-5"
        >
          <CardLabel>Moyenne</CardLabel>
          <div>
            <CardValue>—</CardValue>
            <p className="mt-1 text-[13px] font-semibold">Aucune note</p>
          </div>
        </Card>

        <Card
          tone="green"
          className="flex aspect-square flex-col justify-between p-4 lg:aspect-auto lg:p-5"
        >
          <div className="flex items-start justify-between">
            <CardLabel>Pomodoro</CardLabel>
            <button
              type="button"
              aria-label="Lancer une session"
              className="flex size-11 cursor-pointer items-center justify-center rounded-full border-2 bg-ink text-green"
            >
              <Play className="size-4 fill-current" aria-hidden />
            </button>
          </div>
          <div>
            <CardValue>0 min</CardValue>
            <p className="mt-1 text-[13px] font-semibold">aujourd&apos;hui</p>
          </div>
        </Card>

        <Card className="col-span-2 lg:col-span-4">
          <div className="flex items-center justify-between">
            <CardTitle>À venir</CardTitle>
            <Badge tone="pink">0 en retard</Badge>
          </div>
          <p className="mt-3 text-[15px] text-ink-soft">
            Tes devoirs, projets et examens des 7 prochains jours s&apos;afficheront ici.
          </p>
        </Card>
      </div>
    </>
  );
}
