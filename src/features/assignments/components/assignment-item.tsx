"use client";

import { Check, ChevronRight, Flag } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Badge } from "@/components/ui/badge";
import { subjectColorClass } from "@/features/subjects/colors";
import { DeleteForm } from "@/features/subjects/components/delete-form";
import { cn } from "@/lib/utils";
import { deleteAssignment, toggleAssignmentDone } from "../actions";
import { kindInfo } from "../constants";
import type { AssignmentView } from "../lib/schedule";
import type { SubjectOptionGroup } from "../queries";
import { AssignmentForm } from "./assignment-form";

export type { AssignmentView } from "../lib/schedule";

function DoneToggle({ done, title }: { done: boolean; title: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={
        done ? `Marquer « ${title} » comme à faire` : `Marquer « ${title} » comme terminé`
      }
      className={cn(
        "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-colors",
        done ? "bg-ink text-green" : "bg-surface hover:bg-green",
        pending && "opacity-50",
      )}
    >
      {done && <Check className="size-5" strokeWidth={3} aria-hidden />}
    </button>
  );
}

type AssignmentItemProps = {
  item: AssignmentView;
  groups: SubjectOptionGroup[];
  defaultDue: string;
};

/** Une échéance : rond pour la terminer, ligne touchable pour la modifier. */
export function AssignmentItem({ item, groups, defaultDue }: AssignmentItemProps) {
  const [editing, setEditing] = useState(false);
  const done = item.status === "done";
  const kind = kindInfo(item.kind);

  if (editing) {
    return (
      <li className="rounded-3xl border-2 bg-surface p-5 shadow-hard-sm">
        <AssignmentForm
          groups={groups}
          defaultDue={defaultDue}
          assignment={item}
          onDone={() => setEditing(false)}
        />
        <div className="mt-4 border-t-2 border-dashed border-ink/15 pt-3">
          <DeleteForm
            action={deleteAssignment}
            id={item.id}
            label="Supprimer"
            message={`Supprimer « ${item.title} » ?`}
            withText
          />
        </div>
      </li>
    );
  }

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-3xl border-2 bg-surface p-3",
        item.overdue && "bg-pink/25",
        done && "opacity-60",
      )}
    >
      <form action={toggleAssignmentDone}>
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="done" value={String(!done)} />
        <DoneToggle done={done} title={item.title} />
      </form>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Modifier ${item.title}`}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-2xl text-left"
      >
        <span
          aria-hidden
          className={cn(
            "h-10 w-2 shrink-0 rounded-full border-2",
            subjectColorClass(item.subject.color),
          )}
        />
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-[15px] font-bold", done && "line-through")}>
            {item.title}
          </span>
          <span className="block truncate text-[13px] text-ink-soft">{item.subject.name}</span>
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={item.overdue ? "pink" : "white"}>{item.dueLabel}</Badge>
            <Badge tone={kind.tone}>{kind.label}</Badge>
            {item.status === "in_progress" && <Badge tone="green">En cours</Badge>}
            {item.priority === "high" && !done && (
              <Badge tone="yellow">
                <Flag className="size-3" strokeWidth={3} aria-hidden /> Prioritaire
              </Badge>
            )}
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0" strokeWidth={2.4} aria-hidden />
      </button>
    </li>
  );
}
