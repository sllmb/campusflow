import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardLabel, CardTitle, CardValue } from "@/components/ui/card";
import { CleanupButton } from "@/features/admin/components/cleanup-button";
import { adoptionSummary, signupsByDay } from "@/features/admin/lib/adoption";
import { getAdminAccess, getAdoptionData } from "@/features/admin/queries";
import { DayBars } from "@/features/stats/components/charts";
import { formatNumber, plural } from "@/lib/format";
import { utcToLocalInput } from "@/lib/time";
import { getTimeZone } from "@/lib/timezone";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

function AdminHeader() {
  return (
    <PageHeader
      eyebrow="Réservé à l'éditeur"
      title={
        <span className="flex items-center gap-3">
          <ShieldCheck className="size-9" strokeWidth={2.4} aria-hidden /> Admin
        </span>
      }
      description="L'adoption de CampusFlow, en chiffres globaux."
    />
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="grid content-between gap-3 p-4">
      <CardLabel>{label}</CardLabel>
      <div>
        <CardValue className="text-4xl tabular-nums">{value}</CardValue>
        <p className="mt-1 text-[13px] text-ink-soft">{hint}</p>
      </div>
    </Card>
  );
}

/**
 * Le proxy renvoie déjà 404 à qui n'a pas le rôle admin (avant d'envoyer la page) ; cette
 * vérification est la seconde ligne de défense. Rien, pas même le titre, n'est affiché avant.
 */
async function AdminContent() {
  const access = await getAdminAccess();
  if (access === "denied") notFound();
  if (access === "needs-2fa") {
    return (
      <>
        <AdminHeader />
        <Card className="max-w-xl">
          <CardTitle>Double authentification requise</CardTitle>
          <p className="mt-2 text-[15px] text-ink-soft">
            Le tableau admin lit des chiffres de tous les comptes : il n&apos;est accessible
            qu&apos;avec la double authentification activée et le code saisi.
          </p>
          <ButtonLink href="/profil" variant="dark" className="mt-4">
            Activer la double authentification
          </ButtonLink>
        </Card>
      </>
    );
  }

  await connection();
  const timeZone = await getTimeZone();
  const now = new Date();
  const today = utcToLocalInput(now.toISOString(), timeZone).slice(0, 10);
  const data = await getAdoptionData(today);
  const summary = adoptionSummary(data.accounts, data.activeIds, now);
  const signups = signupsByDay(data.accounts, today, 30, timeZone);
  const signups30 = signups.reduce((sum, day) => sum + day.value, 0);

  return (
    <>
      <AdminHeader />
      <div className="grid gap-5">
        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <Stat
            label="Étudiants"
            value={formatNumber(summary.confirmed)}
            hint={`comptes confirmés (${formatNumber(summary.total)} au total)`}
          />
          <Stat label="Actifs" value={formatNumber(summary.active7)} hint="ces 7 derniers jours" />
          <Stat label="Nouveaux" value={formatNumber(summary.new7)} hint="inscrits en 7 jours" />
          <Stat
            label="Rappels"
            value={formatNumber(data.reminders.subscribers)}
            hint={`abonnés · ${plural(data.reminders.sentToday, "envoi")} aujourd'hui`}
          />
        </div>

        <Card>
          <CardTitle>Inscriptions</CardTitle>
          <p className="text-sm text-ink-soft">
            30 derniers jours · {plural(signups30, "inscription")}
          </p>
          <div className="mt-5">
            <DayBars
              days={signups}
              today={today}
              caption="Inscriptions par jour, 30 derniers jours"
              format={(value) => plural(value, "inscription")}
            />
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardTitle>Contenus créés</CardTitle>
            <ul className="mt-3 grid gap-1.5 text-[15px]">
              <li>{plural(data.content.semesters, "semestre")}</li>
              <li>
                {plural(
                  data.content.assignments,
                  "devoir, projet ou examen",
                  "devoirs, projets ou examens",
                )}
              </li>
              <li>{plural(data.content.grades, "note")}</li>
              <li>{plural(data.content.focusHours, "heure")} de concentration</li>
            </ul>
            <p className="mt-3 text-[13px] text-ink-soft">
              Des totaux seulement : le contenu des comptes reste privé.
            </p>
          </Card>

          <Card>
            <CardTitle>Comptes jamais confirmés</CardTitle>
            <p className="mt-2 text-[15px]">
              {summary.staleUnconfirmed === 0
                ? "Aucun compte en attente depuis plus de 7 jours."
                : `${plural(summary.staleUnconfirmed, "compte")} en attente depuis plus de 7 jours : souvent des robots ou des adresses erronées.`}
            </p>
            <div className="mt-4">
              <CleanupButton count={summary.staleUnconfirmed} />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function AdminSkeleton() {
  return (
    <div className="grid gap-5">
      <div className="h-32 animate-pulse rounded-card bg-muted" />
      <div className="h-64 animate-pulse rounded-card bg-muted" />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminContent />
    </Suspense>
  );
}
