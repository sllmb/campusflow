import type { Metadata } from "next";
import { BookOpen, ClipboardList, PartyPopper } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AssignmentItem } from "@/features/assignments/components/assignment-item";
import { NewAssignmentPanel } from "@/features/assignments/components/new-assignment-panel";
import { AssignmentsViewSwitch } from "@/features/assignments/components/view-switch";
import { KINDS, type AssignmentKind } from "@/features/assignments/constants";
import { listAssignments, listSubjectOptions } from "@/features/assignments/queries";
import { buildSchedule } from "@/features/assignments/lib/schedule";
import { groupByAssignment, listRevisionSlots } from "@/features/revisions/queries";
import { utcToLocalInput } from "@/lib/time";
import { getTimeZone } from "@/lib/timezone";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Devoirs" };

function KindFilter({ active }: { active?: AssignmentKind }) {
  const filters = [
    { value: undefined, label: "Tout" },
    ...KINDS.map((k) => ({ value: k.value, label: k.plural })),
  ];
  return (
    <nav aria-label="Filtrer par type" className="mb-5 flex flex-wrap gap-1.5">
      {filters.map((filter) => {
        const selected = filter.value === active;
        return (
          <Link
            key={filter.label}
            href={filter.value ? `/devoirs?type=${filter.value}` : "/devoirs"}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center rounded-full border-2 px-3.5 text-sm font-bold",
              selected ? "bg-ink text-background" : "bg-surface hover:bg-muted",
            )}
          >
            {filter.label}
          </Link>
        );
      })}
    </nav>
  );
}

async function AssignmentsContent({ searchParams }: PageProps<"/devoirs">) {
  const { type, ajouter } = await searchParams;
  const kind = KINDS.some((k) => k.value === type) ? (type as AssignmentKind) : undefined;

  // L'heure actuelle n'est lue qu'au moment de la requête, jamais pendant le prérendu.
  await connection();
  const timeZone = await getTimeZone();
  const now = new Date();
  const todayLocal = utcToLocalInput(now.toISOString(), timeZone).slice(0, 10);
  const [groups, assignments, revisionSlots] = await Promise.all([
    listSubjectOptions(todayLocal),
    listAssignments(kind),
    listRevisionSlots(),
  ]);
  const revisions = groupByAssignment(revisionSlots);

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Ajoute d'abord tes matières"
        description="Chaque devoir, projet ou examen se rattache à une matière."
        action={<ButtonLink href="/matieres">Aller aux matières</ButtonLink>}
      />
    );
  }

  // Échéance proposée : demain à 23:59, heure locale.
  const tomorrow = new Date(now.getTime() + 86_400_000);
  const defaultDue = `${utcToLocalInput(tomorrow.toISOString(), timeZone).slice(0, 10)}T23:59`;

  const schedule = buildSchedule(assignments, now, timeZone);
  const done = schedule.done;
  const pending = schedule.buckets.filter((bucket) => bucket.items.length > 0);

  return (
    <>
      <KindFilter active={kind} />
      <NewAssignmentPanel groups={groups} defaultDue={defaultDue} defaultOpen={ajouter === "1"} />

      <div className="mt-8 grid gap-8">
        {pending.length === 0 && (
          <EmptyState
            icon={assignments.length ? PartyPopper : ClipboardList}
            title={assignments.length ? "Tout est fait !" : "Rien à rendre"}
            description={
              assignments.length
                ? "Aucune échéance en attente. Profites-en."
                : "Ajoute ton premier devoir, projet ou examen avec le bouton ci-dessus."
            }
          />
        )}
        {pending.map((bucket) => (
          <section key={bucket.key} aria-labelledby={`bucket-${bucket.key}`}>
            <h2
              id={`bucket-${bucket.key}`}
              className={cn(
                "mb-3 flex items-center gap-2 text-lg font-extrabold tracking-tight",
                bucket.key === "overdue" && "text-error",
              )}
            >
              {bucket.title}
              <span className="rounded-full border-2 border-current px-2 text-xs">
                {bucket.items.length}
              </span>
            </h2>
            <ul className="grid gap-3">
              {bucket.items.map((item) => (
                <AssignmentItem
                  key={item.id}
                  item={item}
                  groups={groups}
                  defaultDue={defaultDue}
                  revisions={revisions.get(item.id)}
                  today={todayLocal}
                />
              ))}
            </ul>
          </section>
        ))}

        {done.length > 0 && (
          <details className="group">
            <summary className="mb-3 flex cursor-pointer list-none items-center gap-2 text-lg font-extrabold tracking-tight [&::-webkit-details-marker]:hidden">
              Terminés
              <span className="rounded-full border-2 border-current px-2 text-xs">
                {done.length}
              </span>
              <span className="text-sm font-semibold text-ink-soft group-open:hidden">
                · afficher
              </span>
            </summary>
            <ul className="grid gap-3">
              {done.map((item) => (
                <AssignmentItem key={item.id} item={item} groups={groups} defaultDue={defaultDue} />
              ))}
            </ul>
          </details>
        )}
      </div>
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-3">
      <div className="h-14 animate-pulse rounded-3xl border-2 border-dashed bg-surface" />
      <div className="h-24 animate-pulse rounded-3xl bg-muted" />
      <div className="h-24 animate-pulse rounded-3xl bg-muted" />
    </div>
  );
}

export default function AssignmentsPage(props: PageProps<"/devoirs">) {
  return (
    <>
      <PageHeader
        title="Devoirs"
        description="Devoirs, projets et examens, par échéance."
        action={<AssignmentsViewSwitch active="liste" />}
      />
      <Suspense fallback={<ListSkeleton />}>
        <AssignmentsContent {...props} />
      </Suspense>
    </>
  );
}
