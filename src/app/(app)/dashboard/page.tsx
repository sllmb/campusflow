import type { Metadata } from "next";
import { AlarmClock, CalendarClock, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Accueil" };

const stats = [
  {
    label: "Échéances cette semaine",
    value: "—",
    icon: CalendarClock,
    tone: "bg-info-soft text-info",
  },
  { label: "En retard", value: "—", icon: AlarmClock, tone: "bg-danger-soft text-danger" },
  { label: "Moyenne générale", value: "—", icon: TrendingUp, tone: "bg-primary-soft text-primary" },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Bonjour 👋" description="Voici ce qui vous attend cette semaine." />

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="flex items-center gap-4">
            <div className={`flex size-11 items-center justify-center rounded-md ${tone}`}>
              <Icon className="size-5" aria-hidden />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Échéances proches</CardTitle>
          <CardDescription className="mt-1">
            Vos devoirs, projets et examens des 7 prochains jours apparaîtront ici.
          </CardDescription>
        </Card>
        <Card>
          <CardTitle>Mes matières</CardTitle>
          <CardDescription className="mt-1">
            Moyenne et prochaine échéance de chaque matière.
          </CardDescription>
        </Card>
      </div>
    </>
  );
}
