"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatNumber, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import { deleteSubject, deleteUnit } from "../actions";
import { subjectColorClass } from "../colors";
import type { Subject, UnitWithSubjects } from "../queries";
import { AddPanel } from "./add-panel";
import { DeleteForm } from "./delete-form";
import { IconAction } from "./icon-action";
import { SubjectForm } from "./subject-form";
import { UnitForm } from "./unit-form";

function SubjectRow({ subject, unitId }: { subject: Subject; unitId: string }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-3xl border-2 bg-background p-4">
        <SubjectForm unitId={unitId} subject={subject} onDone={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 py-2.5">
      <span
        aria-hidden
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl border-2 font-extrabold",
          subjectColorClass(subject.color),
        )}
      >
        {subject.name.trim().charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold">{subject.name}</p>
        <p className="text-[13px] text-ink-soft">Coefficient {formatNumber(subject.coefficient)}</p>
      </div>
      <IconAction aria-label={`Modifier ${subject.name}`} onClick={() => setEditing(true)}>
        <Pencil strokeWidth={2.2} />
      </IconAction>
      <DeleteForm
        action={deleteSubject}
        id={subject.id}
        label={`Supprimer ${subject.name}`}
        message={`Supprimer la matière « ${subject.name} » ?`}
      />
    </li>
  );
}

export function UnitCard({ unit, semesterId }: { unit: UnitWithSubjects; semesterId: string }) {
  const [editing, setEditing] = useState(false);
  const totalCoef = unit.subjects.reduce((sum, subject) => sum + subject.coefficient, 0);
  const nextColor = ((unit.subjects.at(-1)?.color ?? 0) % 8) + 1;

  return (
    <section aria-label={unit.name} className="rounded-card border-2 bg-surface p-5 shadow-hard">
      {editing ? (
        <UnitForm semesterId={semesterId} unit={unit} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {unit.code && <Badge tone="dark">{unit.code}</Badge>}
              <Badge tone="yellow">{plural(unit.ects_credits, "crédit")} ECTS</Badge>
            </div>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight">{unit.name}</h2>
            <p className="text-[13px] text-ink-soft">
              {plural(unit.subjects.length, "matière")}
              {unit.subjects.length > 0 && ` · coefficients : ${formatNumber(totalCoef)} au total`}
            </p>
          </div>
          <IconAction aria-label={`Modifier l'UE ${unit.name}`} onClick={() => setEditing(true)}>
            <Pencil strokeWidth={2.2} />
          </IconAction>
          <DeleteForm
            action={deleteUnit}
            id={unit.id}
            label={`Supprimer l'UE ${unit.name}`}
            message={`Supprimer l'UE « ${unit.name} » et ses ${unit.subjects.length} matière(s) ?`}
          />
        </div>
      )}

      {unit.subjects.length > 0 && (
        <ul className="mt-3 divide-y-2 divide-dashed divide-ink/15 border-t-2 border-dashed border-ink/15">
          {unit.subjects.map((subject) => (
            <SubjectRow key={subject.id} subject={subject} unitId={unit.id} />
          ))}
        </ul>
      )}

      <AddPanel label="Ajouter une matière" className="mt-4 bg-background">
        {(close) => <SubjectForm unitId={unit.id} suggestedColor={nextColor} onDone={close} />}
      </AddPanel>
    </section>
  );
}
