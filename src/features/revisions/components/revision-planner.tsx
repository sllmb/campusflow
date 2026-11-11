"use client";

import { CalendarClock, ChevronDown } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/features/auth/components/field";
import { formatMinutes } from "@/features/focus/lib/timer";
import { DeleteForm } from "@/features/subjects/components/delete-form";
import { FormShell } from "@/features/subjects/components/form-shell";
import { useCloseOnSuccess } from "@/features/subjects/components/use-close-on-success";
import { cn } from "@/lib/utils";
import { deleteRevisionPlan, planRevisionsAction } from "../actions";
import { slotDayLabel, summarize, WEEKDAYS } from "../lib/plan";
import { RevisionSlotRow, type RevisionSlotView } from "./revision-slot-row";

function PlanForm({
  assignmentId,
  examDay,
  today,
  replacing,
  onDone,
}: {
  assignmentId: string;
  examDay: string;
  today: string;
  replacing: boolean;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(planRevisionsAction, {});
  useCloseOnSuccess(state, onDone);
  const chosen = state.values?.weekdays?.split(",");
  const weekdaysError = state.fieldErrors?.weekdays?.[0];

  return (
    <FormShell
      action={action}
      pending={pending}
      error={state.error}
      submitLabel={replacing ? "Refaire le planning" : "Planifier"}
      onCancel={onDone}
    >
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <p className="text-[13px] text-ink-soft">
        Les créneaux sont répartis de {slotDayLabel(today, today).toLowerCase()} à la veille de
        l&apos;échéance ({slotDayLabel(examDay, today).toLowerCase()}), par quarts d&apos;heure.
        {replacing && " Les créneaux déjà faits sont gardés."}
      </p>
      <Field
        name="hours"
        id={`plan-hours-${assignmentId}`}
        label="Temps de révision (en heures)"
        inputMode="decimal"
        placeholder="10"
        defaultValue={state.values?.hours}
        hint="Par exemple 10, ou 1,5 pour 1 h 30."
        errors={state.fieldErrors?.hours}
      />
      <fieldset aria-describedby={weekdaysError ? `plan-days-${assignmentId}-error` : undefined}>
        <legend className="text-sm font-bold">Jours où tu peux réviser</legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {WEEKDAYS.map((day) => (
            <label key={day.index} className="cursor-pointer">
              <input
                type="checkbox"
                name="weekday"
                value={day.index}
                defaultChecked={chosen ? chosen.includes(String(day.index)) : true}
                className="peer sr-only"
              />
              <span
                title={day.long}
                className="inline-flex h-9 items-center rounded-full border-2 bg-background px-3 text-sm font-bold peer-checked:bg-ink peer-checked:text-background peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue"
              >
                {day.short}
              </span>
            </label>
          ))}
        </div>
        {weekdaysError && (
          <p
            id={`plan-days-${assignmentId}-error`}
            className="mt-1.5 text-[13px] font-semibold text-error"
          >
            {weekdaysError}
          </p>
        )}
      </fieldset>
    </FormShell>
  );
}

/** Planning de révisions d'un examen ou d'un projet, sous sa ligne dans Devoirs. */
export function RevisionPlanner({
  assignmentId,
  examDay,
  today,
  slots,
}: {
  assignmentId: string;
  /** Jour de l'échéance, dans le fuseau de l'étudiant. */
  examDay: string;
  today: string;
  slots: RevisionSlotView[];
}) {
  const [open, setOpen] = useState(false);
  const [planning, setPlanning] = useState(false);
  const summary = summarize(slots, today);
  const panelId = `revisions-${assignmentId}`;
  const canPlan = examDay > today;

  if (slots.length === 0 && !planning) {
    if (!canPlan) return null;
    return (
      <button
        type="button"
        onClick={() => setPlanning(true)}
        className="inline-flex h-9 cursor-pointer items-center gap-1.5 self-start rounded-full border-2 border-dashed px-3 text-sm font-bold hover:bg-surface"
      >
        <CalendarClock className="size-4" strokeWidth={2.4} aria-hidden />
        Planifier mes révisions
      </button>
    );
  }

  return (
    <div className="grid gap-3">
      {slots.length > 0 && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="flex cursor-pointer items-center gap-2 text-left text-sm font-bold"
        >
          <CalendarClock className="size-4 shrink-0" strokeWidth={2.4} aria-hidden />
          <span className="min-w-0 flex-1">
            Révisions : {formatMinutes(summary.done)} sur {formatMinutes(summary.total)}
            <span className="font-semibold text-ink-soft">
              {summary.next
                ? ` · prochain : ${slotDayLabel(summary.next.planned_on, today).toLowerCase()}, ${formatMinutes(summary.next.minutes)}`
                : summary.done === summary.total
                  ? " · tout est fait"
                  : ""}
            </span>
          </span>
          <ChevronDown
            className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")}
            strokeWidth={2.6}
            aria-hidden
          />
        </button>
      )}

      {planning ? (
        <div className="rounded-2xl border-2 border-dashed p-4">
          <PlanForm
            assignmentId={assignmentId}
            examDay={examDay}
            today={today}
            replacing={slots.length > 0}
            onDone={() => {
              setPlanning(false);
              setOpen(true);
            }}
          />
        </div>
      ) : (
        open && (
          <div id={panelId} className="grid gap-3">
            <ul className="grid gap-2.5">
              {slots.map((slot) => (
                <RevisionSlotRow key={slot.id} slot={slot} today={today} />
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-2 border-t-2 border-dashed border-ink/15 pt-3">
              {canPlan && (
                <Button variant="outline" size="sm" onClick={() => setPlanning(true)}>
                  Refaire le planning
                </Button>
              )}
              <DeleteForm
                action={deleteRevisionPlan}
                id={assignmentId}
                label="Supprimer le planning"
                message="Supprimer tous les créneaux de révision de cet examen ?"
                withText
              />
            </div>
          </div>
        )
      )}
    </div>
  );
}
