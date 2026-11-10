import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = { title: "Style guide" };

const palette = [
  ["primary", "bg-primary"],
  ["info", "bg-info"],
  ["success", "bg-success"],
  ["warning", "bg-warning"],
  ["danger", "bg-danger"],
  ["muted", "bg-muted"],
  ["border", "bg-border"],
  ["foreground", "bg-foreground"],
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
      <PageHeader title="Style guide" description="Couleurs, typographie et composants de base." />

      <div className="grid gap-6">
        <Card>
          <CardTitle>Couleurs</CardTitle>
          <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-8">
            {palette.map(([name, cls]) => (
              <div key={name} className="text-center">
                <div className={`h-12 rounded-md border ${cls}`} />
                <p className="mt-1.5 text-xs text-muted-foreground">{name}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm font-medium">Couleurs des matières</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {subjects.map((cls) => (
              <div key={cls} className={`size-9 rounded-full ${cls}`} />
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Typographie</CardTitle>
          <div className="mt-4 space-y-2">
            <p className="text-3xl font-bold tracking-tight">Titre de page</p>
            <p className="text-xl font-semibold tracking-tight">Titre de section</p>
            <p className="text-base">Texte courant : Plus Jakarta Sans, lisible sur mobile.</p>
            <p className="text-sm text-muted-foreground">Texte secondaire et descriptions.</p>
          </div>
        </Card>

        <Card>
          <CardTitle>Boutons</CardTitle>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button>
              <Plus /> Ajouter un devoir
            </Button>
            <Button variant="secondary">Secondaire</Button>
            <Button variant="outline">Contour</Button>
            <Button variant="ghost">Discret</Button>
            <Button variant="danger">Supprimer</Button>
            <Button disabled>Désactivé</Button>
          </div>
        </Card>

        <Card>
          <CardTitle>Badges</CardTitle>
          <CardDescription className="mt-1">Statuts et priorités des devoirs.</CardDescription>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>À faire</Badge>
            <Badge tone="primary">En cours</Badge>
            <Badge tone="info">Cours</Badge>
            <Badge tone="success">Terminé</Badge>
            <Badge tone="warning">Bientôt</Badge>
            <Badge tone="danger">En retard</Badge>
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
              <Input id="sg-coef" type="number" defaultValue={3} aria-invalid />
              <p className="text-xs text-danger">Exemple d&apos;erreur de validation.</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
