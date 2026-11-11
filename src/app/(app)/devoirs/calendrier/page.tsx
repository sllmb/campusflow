import type { Metadata } from "next";
import { BookOpen, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AssignmentItem } from "@/features/assignments/components/assignment-item";
import { CalendarMonth } from "@/features/assignments/components/calendar-month";
import { NewAssignmentPanel } from "@/features/assignments/components/new-assignment-panel";
import { AssignmentsViewSwitch, Segmented } from "@/features/assignments/components/view-switch";
import {
  addDays,
  capitalize,
  dayLabel,
  groupByDay,
  monthLabel,
  parseDay,
  parseView,
  stepDate,
  visibleRange,
  weekDays,
  weekLabel,
  type CalendarView,
} from "@/features/assignments/lib/calendar";
import { buildSchedule, type AssignmentView } from "@/features/assignments/lib/schedule";
import { RevisionSlotRow } from "@/features/revisions/components/revision-slot-row";
import { listRevisionSlots, type RevisionSlot } from "@/features/revisions/queries";
import {
  listAssignments,
  listSubjectOptions,
  type SubjectOptionGroup,
} from "@/features/assignments/queries";
import { utcToLocalInput } from "@/lib/time";
import { getTimeZone } from "@/lib/timezone";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Calendrier" };

function calendarHref(view: CalendarView, date: string, add = false) {
  return `/devoirs/calendrier?vue=${view}&date=${date}${add ? "&ajouter=1" : ""}`;
}

function DayItems({
  items,
  revisions,
  groups,
  date,
  today,
}: {
  items: AssignmentView[];
  revisions: RevisionSlot[];
  groups: SubjectOptionGroup[];
  date: string;
  today: string;
}) {
  if (items.length === 0 && revisions.length === 0) {
    return <p className="text-sm text-ink-soft">Rien de prévu.</p>;
  }
  return (
    <>
      {items.length > 0 && (
        <ul className="grid gap-3">
          {items.map((item) => (
            <AssignmentItem
              key={item.id}
              item={item}
              groups={groups}
              defaultDue={`${date}T23:59`}
            />
          ))}
        </ul>
      )}
      {revisions.length > 0 && (
        <div className="rounded-3xl border-2 border-dashed p-3">
          <p className="mb-2.5 text-sm font-bold">Révisions</p>
          <ul className="grid gap-2.5">
            {revisions.map((slot) => (
              <RevisionSlotRow key={slot.id} slot={slot} today={today} context />
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

async function CalendarContent({ searchParams }: PageProps<"/devoirs/calendrier">) {
  const params = await searchParams;
  const view = parseView(params.vue);

  // L'heure actuelle n'est lue qu'au moment de la requête, jamais pendant le prérendu.
  await connection();
  const timeZone = await getTimeZone();
  const now = new Date();
  const today = utcToLocalInput(now.toISOString(), timeZone).slice(0, 10);
  const selected = parseDay(params.date) ?? today;
  const adding = params.ajouter === "1";

  // Un jour de marge de chaque côté : quel que soit le fuseau, aucune échéance visible
  // n'est oubliée. Le classement par jour local se fait ensuite, dans groupByDay.
  const { first, last } = visibleRange(view, selected);
  const [groups, assignments, revisionSlots] = await Promise.all([
    listSubjectOptions(today),
    listAssignments(undefined, {
      from: `${addDays(first, -1)}T00:00:00Z`,
      to: `${addDays(last, 2)}T00:00:00Z`,
    }),
    listRevisionSlots({ first, last }),
  ]);

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

  const schedule = buildSchedule(assignments, now, timeZone);
  const byDay = groupByDay([...schedule.pending, ...schedule.done]);
  const revisionsByDay = groupByDay(
    revisionSlots.map((slot) => ({ ...slot, dueLocal: `${slot.planned_on}T00:00` })),
  );
  const unit = view === "mois" ? "Mois" : "Semaine";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Link
            href={calendarHref(view, stepDate(view, selected, -1))}
            scroll={false}
            aria-label={`${unit} précédent${view === "semaine" ? "e" : ""}`}
            className={buttonClasses({ variant: "ghost", size: "sm" })}
          >
            <ChevronLeft strokeWidth={2.6} aria-hidden />
          </Link>
          <h2 className="min-w-36 text-center text-lg font-extrabold tracking-tight">
            {capitalize(view === "mois" ? monthLabel(selected) : weekLabel(selected))}
          </h2>
          <Link
            href={calendarHref(view, stepDate(view, selected, 1))}
            scroll={false}
            aria-label={`${unit} suivant${view === "semaine" ? "e" : ""}`}
            className={buttonClasses({ variant: "ghost", size: "sm" })}
          >
            <ChevronRight strokeWidth={2.6} aria-hidden />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {selected !== today && (
            <Link
              href={calendarHref(view, today)}
              scroll={false}
              className={buttonClasses({ variant: "outline", size: "sm" })}
            >
              Aujourd&apos;hui
            </Link>
          )}
          <Segmented
            label="Période affichée"
            options={[
              { href: calendarHref("mois", selected), label: "Mois", selected: view === "mois" },
              {
                href: calendarHref("semaine", selected),
                label: "Semaine",
                selected: view === "semaine",
              },
            ]}
          />
        </div>
      </div>

      {view === "mois" ? (
        <>
          <CalendarMonth
            selected={selected}
            today={today}
            byDay={byDay}
            revisionsByDay={revisionsByDay}
            hrefFor={(date) => calendarHref("mois", date)}
          />
          <section aria-labelledby="selected-day" className="mt-6 grid gap-4">
            <h3 id="selected-day" className="text-lg font-extrabold tracking-tight">
              {capitalize(dayLabel(selected))}
            </h3>
            <DayItems
              items={byDay.get(selected) ?? []}
              revisions={revisionsByDay.get(selected) ?? []}
              groups={groups}
              date={selected}
              today={today}
            />
            <NewAssignmentPanel
              key={selected}
              groups={groups}
              defaultDue={`${selected}T23:59`}
              defaultOpen={adding}
              label={`Ajouter pour le ${dayLabel(selected)}`}
            />
          </section>
        </>
      ) : (
        <div className="grid gap-6">
          {weekDays(selected).map(({ date }) => {
            const items = byDay.get(date) ?? [];
            const count = items.length + (revisionsByDay.get(date)?.length ?? 0);
            const isToday = date === today;
            return (
              <section key={date} aria-labelledby={`day-${date}`} className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h3
                    id={`day-${date}`}
                    className={cn(
                      "flex items-center gap-2 text-lg font-extrabold tracking-tight",
                      isToday && "underline decoration-primary decoration-4 underline-offset-4",
                    )}
                  >
                    {capitalize(dayLabel(date))}
                    {count > 0 && (
                      <span className="rounded-full border-2 border-current px-2 text-xs">
                        {count}
                      </span>
                    )}
                  </h3>
                  {!(adding && date === selected) && (
                    <Link
                      href={calendarHref("semaine", date, true)}
                      scroll={false}
                      aria-label={`Ajouter une échéance le ${dayLabel(date)}`}
                      className={buttonClasses({ variant: "ghost", size: "sm" })}
                    >
                      <Plus strokeWidth={2.6} aria-hidden />
                    </Link>
                  )}
                </div>
                <DayItems
                  items={items}
                  revisions={revisionsByDay.get(date) ?? []}
                  groups={groups}
                  date={date}
                  today={today}
                />
                {adding && date === selected && (
                  <NewAssignmentPanel
                    key={date}
                    groups={groups}
                    defaultDue={`${date}T23:59`}
                    defaultOpen
                    label={`Ajouter pour le ${dayLabel(date)}`}
                  />
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

function CalendarSkeleton() {
  return (
    <div className="grid gap-3">
      <div className="h-11 animate-pulse rounded-full bg-muted" />
      <div className="h-80 animate-pulse rounded-3xl bg-muted" />
    </div>
  );
}

export default function CalendarPage(props: PageProps<"/devoirs/calendrier">) {
  return (
    <>
      <PageHeader
        title="Devoirs"
        description="Tes échéances jour par jour."
        action={<AssignmentsViewSwitch active="calendrier" />}
      />
      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarContent {...props} />
      </Suspense>
    </>
  );
}
