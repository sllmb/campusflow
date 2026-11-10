import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardLabel, CardTitle, CardValue } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = { title: "Style guide" };

const palette = [
  ["Jaune · action", "bg-yellow"],
  ["Bleu · info", "bg-blue"],
  ["Vert · succès", "bg-green"],
  ["Rose · retard", "bg-pink"],
  ["Orange", "bg-orange"],
  ["Encre", "bg-ink"],
  ["Fond", "bg-background"],
  ["Surface", "bg-surface"],
] as const;

const subjects = [
  "bg-subject-1",
  "bg-subject-2",
  "bg-subject-3",
  "bg-subject-4",
  "bg-subject-5",
  "bg-subject-6",
  "bg-subject-7",
  "bg-subject-8",
];

/** Vitrine des composants, disponible en développement uniquement. */
export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <>
      <PageHeader
        eyebrow="Design system"
        title="Style guide"
        description="Couleurs, typographie et composants de base."
      />

      <div className="grid gap-6">
        <Card>
          <CardTitle>Couleurs</CardTitle>
          <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-8">
            {palette.map(([name, cls]) => (
              <div key={name}>
                <div className={`h-14 rounded-2xl border-2 ${cls}`} />
                <p className="mt-1.5 text-xs font-semibold">{name}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm font-bold">Couleurs des matières</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {subjects.map((cls, i) => (
              <span
                key={cls}
                className={`flex size-10 items-center justify-center rounded-xl border-2 font-extrabold ${cls}`}
              >
                {i + 1}
              </span>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Typographie · Bricolage Grotesque</CardTitle>
          <div className="mt-4 space-y-2">
            <p className="text-5xl font-extrabold tracking-[-0.03em]">Salut !</p>
            <p className="text-[28px] leading-tight font-extrabold tracking-[-0.03em]">
              DM Probabilités
            </p>
            <p className="text-lg font-extrabold">Titre de carte</p>
            <p className="text-[15px]">Texte courant, lisible sur mobile.</p>
            <p className="text-sm text-ink-soft">Texte secondaire et descriptions.</p>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          <Card tone="yellow" className="flex aspect-square flex-col justify-between p-4">
            <CardLabel>Moyenne</CardLabel>
            <CardValue>13,4</CardValue>
          </Card>
          <Card tone="green" className="flex aspect-square flex-col justify-between p-4">
            <CardLabel>Pomodoro</CardLabel>
            <CardValue>1h50</CardValue>
          </Card>
          <Card tone="blue" className="flex aspect-square flex-col justify-between p-4">
            <CardLabel>Cette semaine</CardLabel>
            <CardValue>3</CardValue>
          </Card>
          <Card tone="pink" className="flex aspect-square flex-col justify-between p-4">
            <CardLabel>En retard</CardLabel>
            <CardValue>2</CardValue>
          </Card>
        </div>

        <Card>
          <CardTitle>Boutons</CardTitle>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button>
              <Plus /> Ajouter un devoir
            </Button>
            <Button variant="dark">Enregistrer</Button>
            <Button variant="outline">Annuler</Button>
            <Button variant="ghost">Discret</Button>
            <Button variant="danger">Supprimer</Button>
            <Button disabled>Désactivé</Button>
            <Button size="icon" aria-label="Ajouter">
              <Plus />
            </Button>
          </div>
        </Card>

        <Card>
          <CardTitle>Badges</CardTitle>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>Mathématiques</Badge>
            <Badge tone="dark">Demain 23:59</Badge>
            <Badge tone="yellow">À faire</Badge>
            <Badge tone="blue">En cours</Badge>
            <Badge tone="green">Terminé</Badge>
            <Badge tone="orange">Bientôt</Badge>
            <Badge tone="pink">En retard</Badge>
          </div>
        </Card>

        <Card>
          <CardTitle>Formulaire</CardTitle>
          <div className="mt-4 grid max-w-md gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="sg-name">Nom de la matière</Label>
              <Input id="sg-name" placeholder="Mathématiques" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sg-coef">Coefficient</Label>
              <Input id="sg-coef" type="number" defaultValue={0} aria-invalid />
              <p className="text-[13px] font-semibold text-error">
                Le coefficient doit être supérieur à 0.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
