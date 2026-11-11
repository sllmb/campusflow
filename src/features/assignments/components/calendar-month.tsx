import Link from "next/link";
import { subjectColorClass } from "@/features/subjects/colors";
import { cn } from "@/lib/utils";
import { dayLabel, monthGrid, WEEKDAY_INITIALS } from "../lib/calendar";
import type { AssignmentView } from "../lib/schedule";

const MAX_DOTS = 3;

type CalendarMonthProps = {
  /** Jour sélectionné, « 2026-11-17 » : le mois affiché est le sien. */
  selected: string;
  today: string;
  byDay: Map<string, AssignmentView[]>;
  /** Créneaux de révision par jour : un petit carré au lieu d'un rond. */
  revisionsByDay?: Map<string, { id: string; done: boolean; subject: { color: number } }[]>;
  hrefFor: (date: string) => string;
};

function countLabel(items: AssignmentView[]) {
  const pending = items.filter((item) => item.status !== "done").length;
  if (items.length === 0) return "rien de prévu";
  if (pending === 0)
    return items.length === 1 ? "1 échéance terminée" : `${items.length} échéances terminées`;
  return pending === 1 ? "1 échéance" : `${pending} échéances`;
}

/** Grille du mois : un point de la couleur de la matière par échéance. */
export function CalendarMonth({
  selected,
  today,
  byDay,
  revisionsByDay,
  hrefFor,
}: CalendarMonthProps) {
  const weeks = monthGrid(selected);

  return (
    <table className="w-full table-fixed border-separate border-spacing-1">
      <thead>
        <tr>
          {WEEKDAY_INITIALS.map(({ short, long }) => (
            <th key={long} scope="col" className="pb-1 text-xs font-bold text-ink-soft">
              <abbr title={long} className="no-underline">
                {short}
              </abbr>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week) => (
          <tr key={week[0].date}>
            {week.map(({ date, day, inMonth }) => {
              const items = byDay.get(date) ?? [];
              const revisions = revisionsByDay?.get(date) ?? [];
              const pendingRevisions = revisions.filter((slot) => !slot.done).length;
              const isSelected = date === selected;
              const isToday = date === today;
              const hasOverdue = items.some((item) => item.overdue);
              return (
                <td key={date} className="p-0">
                  <Link
                    href={hrefFor(date)}
                    scroll={false}
                    aria-current={isToday ? "date" : undefined}
                    aria-label={`${dayLabel(date)}${isToday ? ", aujourd'hui" : ""} : ${countLabel(items)}${revisions.length ? `, ${revisions.length} révision${revisions.length > 1 ? "s" : ""}${pendingRevisions === 0 ? " faite" + (revisions.length > 1 ? "s" : "") : ""}` : ""}${isSelected ? " (sélectionné)" : ""}`}
                    className={cn(
                      "flex h-14 flex-col items-center gap-1 rounded-2xl border-2 pt-1.5 transition-colors sm:h-20",
                      isSelected
                        ? "bg-ink text-background"
                        : isToday
                          ? "bg-primary"
                          : "border-transparent hover:border-ink hover:bg-surface",
                      !inMonth && !isSelected && "opacity-40",
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm font-bold tabular-nums",
                        hasOverdue && !isSelected && "text-error",
                      )}
                    >
                      {day}
                    </span>
                    {(items.length > 0 || revisions.length > 0) && (
                      <span aria-hidden className="flex items-center gap-0.5">
                        {items.slice(0, MAX_DOTS).map((item) => (
                          <span
                            key={item.id}
                            className={cn(
                              "size-2 rounded-full border",
                              isSelected ? "border-background" : "border-ink",
                              subjectColorClass(item.subject.color),
                              item.status === "done" && "opacity-40",
                            )}
                          />
                        ))}
                        {items.length > MAX_DOTS && (
                          <span className="text-[10px] leading-none font-bold">
                            +{items.length - MAX_DOTS}
                          </span>
                        )}
                        {revisions.slice(0, items.length ? 1 : 2).map((slot) => (
                          <span
                            key={slot.id}
                            className={cn(
                              "size-2 rounded-[2px] border",
                              isSelected ? "border-background" : "border-ink",
                              subjectColorClass(slot.subject.color),
                              slot.done && "opacity-40",
                            )}
                          />
                        ))}
                      </span>
                    )}
                  </Link>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
