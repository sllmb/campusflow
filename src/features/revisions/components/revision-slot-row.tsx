"use client";

import { Check, Pencil, Play } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Field } from "@/features/auth/components/field";
import { formatMinutes } from "@/features/focus/lib/timer";
import { subjectColorClass } from "@/features/subjects/colors";
import { DeleteForm } from "@/features/subjects/components/delete-form";
import { FormShell } from "@/features/subjects/components/form-shell";
import { IconAction } from "@/features/subjects/components/icon-action";
import { useCloseOnSuccess } from "@/features/subjects/components/use-close-on-success";
import { cn } from "@/lib/utils";
import { deleteRevisionSlot, toggleRevisionDone, updateRevisionSlot } from "../actions";
import { BLOCK_MINUTES, launchHref, MAX_MINUTES_PER_DAY, slotDayLabel } from "../lib/plan";

export type RevisionSlotView = {
  id: string;
  planned_on: string;
  minutes: number;
  done: boolean;
  assignment: { id: string; title: string };
  subject: { id: string; name: string; color: number };
};

const DURATIONS = Array.from(
  { length: MAX_MINUTES_PER_DAY / BLOCK_MINUTES },
  (_, i) => (i + 1) * BLOCK_MINUTES,
);

function DoneToggle({ done, label }: { done: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={done ? `Marquer « ${label} » comme à faire` : `Marquer « ${label} » comme fait`}
      className={cn(
        "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 transition-colors",
        done ? "bg-ink text-green" : "bg-surface hover:bg-green",
        pending && "opacity-50",
      )}
    >
      {done && <Check className="size-4" strokeWidth={3} aria-hidden />}
    </button>
  );
}

function EditSlot({ slot, onDone }: { slot: RevisionSlotView; onDone: () => void }) {
  const [state, action, pending] = useActionState(updateRevisionSlot, {});
  useCloseOnSuccess(state, onDone);
  return (
    <div className="grid gap-3">
      <FormShell
        action={action}
        pending={pending}
        error={state.error}
        submitLabel="Enregistrer"
        onCancel={onDone}
      >
        <input type="hidden" name="id" value={slot.id} />
        <div className="grid grid-cols-2 gap-3">
          <Field
            name="plannedOn"
            id={`slot-day-${slot.id}`}
            label="Jour"
            type="date"
            defaultValue={slot.planned_on}
            errors={state.fieldErrors?.plannedOn}
          />
          <div className="grid gap-1.5">
            <Label htmlFor={`slot-minutes-${slot.id}`}>Durée</Label>
            <Select id={`slot-minutes-${slot.id}`} name="minutes" defaultValue={slot.minutes}>
              {DURATIONS.map((value) => (
                <option key={value} value={value}>
                  {formatMinutes(value)}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </FormShell>
      <DeleteForm
        action={deleteRevisionSlot}
        id={slot.id}
        label="Supprimer ce créneau"
        message="Supprimer ce créneau de révision ?"
        withText
      />
    </div>
  );
}

/**
 * Un créneau de révision : case à cocher, jour ou examen, durée, « Lancer » le minuteur.
 * `context` : affiche l'examen et la matière (calendrier, accueil) au lieu du jour.
 */
export function RevisionSlotRow({
  slot,
  today,
  context = false,
}: {
  slot: RevisionSlotView;
  today: string;
  context?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const missed = !slot.done && slot.planned_on < today;
  const title = context ? `Réviser ${slot.assignment.title}` : slotDayLabel(slot.planned_on, today);

  if (editing) {
    return (
      <li className="rounded-2xl border-2 border-dashed p-3">
        <EditSlot slot={slot} onDone={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className={cn("flex items-center gap-2.5", slot.done && "opacity-60")}>
      <form action={toggleRevisionDone}>
        <input type="hidden" name="id" value={slot.id} />
        <input type="hidden" name="done" value={String(!slot.done)} />
        <DoneToggle done={slot.done} label={title} />
      </form>
      {context && (
        <span
          aria-hidden
          className={cn(
            "h-8 w-1.5 shrink-0 rounded-full border",
            subjectColorClass(slot.subject.color),
          )}
        />
      )}
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate text-[15px] font-bold", slot.done && "line-through")}>
          {title}
        </span>
        <span className={cn("block truncate text-[13px] text-ink-soft", missed && "text-error")}>
          {formatMinutes(slot.minutes)}
          {context && ` · ${slot.subject.name}`}
          {missed && " · pas fait"}
        </span>
      </span>
      {!slot.done && (
        <Link
          href={launchHref({ minutes: slot.minutes, subjectId: slot.subject.id })}
          aria-label={`Lancer ${formatMinutes(slot.minutes)} de révision en ${slot.subject.name}`}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border-2 bg-green px-3 text-sm font-bold"
        >
          <Play className="size-3.5 fill-current" aria-hidden />
          Lancer
        </Link>
      )}
      <IconAction aria-label={`Modifier le créneau : ${title}`} onClick={() => setEditing(true)}>
        <Pencil strokeWidth={2.2} />
      </IconAction>
    </li>
  );
}
