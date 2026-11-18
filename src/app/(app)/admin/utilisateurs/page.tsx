import type { Metadata } from "next";
import { Search, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/features/assignments/components/view-switch";
import { UserActions } from "@/features/admin/components/user-actions";
import {
  canManage,
  filterUserRows,
  parseUserFilter,
  USER_FILTERS,
} from "@/features/admin/lib/users";
import { getAdminAccess, getUserRows } from "@/features/admin/queries";
import { plural } from "@/lib/format";
import { getTimeZone } from "@/lib/timezone";

export const metadata: Metadata = { title: "Utilisateurs", robots: { index: false } };

function UsersHeader() {
  return (
    <PageHeader
      eyebrow="Réservé à l'éditeur"
      title={
        <span className="flex items-center gap-3">
          <Users className="size-9" strokeWidth={2.4} aria-hidden /> Utilisateurs
        </span>
      }
      description="Les comptes : identité, état, activité. Jamais leur contenu."
    />
  );
}

/** Comme le tableau admin : le proxy renvoie déjà 404 aux autres, la page revérifie. */
async function UsersContent({ searchParams }: PageProps<"/admin/utilisateurs">) {
  const access = await getAdminAccess();
  if (access === "denied") notFound();
  if (access === "needs-2fa") {
    return (
      <>
        <UsersHeader />
        <Card className="max-w-xl">
          <CardTitle>Double authentification requise</CardTitle>
          <ButtonLink href="/profil" variant="dark" className="mt-4">
            Activer la double authentification
          </ButtonLink>
        </Card>
      </>
    );
  }

  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const filter = parseUserFilter(params.filtre);
  await connection();
  const timeZone = await getTimeZone();
  const date = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone,
  });
  const { rows, adminId } = await getUserRows();
  const shown = filterUserRows(rows, query, filter);
  const href = (value: string) => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (value !== "tous") search.set("filtre", value);
    const text = search.toString();
    return `/admin/utilisateurs${text ? `?${text}` : ""}`;
  };

  return (
    <>
      <UsersHeader />
      <div className="grid gap-5">
        <form role="search" className="flex gap-2" action="/admin/utilisateurs">
          {filter !== "tous" && <input type="hidden" name="filtre" value={filter} />}
          <label htmlFor="users-q" className="sr-only">
            Chercher par e-mail ou prénom
          </label>
          <Input
            id="users-q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="E-mail ou prénom"
            className="flex-1"
          />
          <Button type="submit" variant="dark" aria-label="Chercher">
            <Search />
          </Button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            label="Filtrer les comptes"
            options={USER_FILTERS.map((f) => ({
              href: href(f.value),
              label: f.label,
              selected: f.value === filter,
            }))}
          />
          <p className="text-sm font-semibold text-ink-soft">
            {plural(shown.length, "compte")} sur {rows.length}
          </p>
        </div>

        {shown.length === 0 ? (
          <p className="text-[15px] text-ink-soft">Aucun compte ne correspond.</p>
        ) : (
          <ul className="grid gap-3">
            {shown.map((row) => (
              <li key={row.id}>
                <Card className="grid gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-extrabold">
                      {row.name || "Sans prénom"}
                    </p>
                    <p className="truncate text-[13px] text-ink-soft">{row.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {row.isAdmin && <Badge tone="dark">Admin</Badge>}
                    {row.suspended && <Badge tone="pink">Suspendu</Badge>}
                    <Badge tone={row.confirmed ? "green" : "orange"}>
                      {row.confirmed ? "Confirmé" : "Non confirmé"}
                    </Badge>
                    {row.activeThisWeek && <Badge tone="yellow">Actif cette semaine</Badge>}
                    {row.twoFactor && <Badge>2FA</Badge>}
                    {row.reminders && <Badge>Rappels</Badge>}
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 text-[13px]">
                    <dt className="text-ink-soft">Inscription</dt>
                    <dd className="font-semibold">{date.format(new Date(row.createdAt))}</dd>
                    <dt className="text-ink-soft">Dernière connexion</dt>
                    <dd className="font-semibold">
                      {row.lastSignInAt ? date.format(new Date(row.lastSignInAt)) : "Jamais"}
                    </dd>
                  </dl>
                  {canManage(row, adminId) && (
                    <UserActions id={row.id} label={row.email} suspended={row.suspended} />
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default function UsersPage(props: PageProps<"/admin/utilisateurs">) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-card bg-muted" />}>
      <UsersContent {...props} />
    </Suspense>
  );
}
