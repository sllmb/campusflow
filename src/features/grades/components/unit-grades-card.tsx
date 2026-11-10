"use client";

import { Gavel, Plus } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { subjectColorClass } from "@/features/subjects/colors";
import { DeleteForm } from "@/features/subjects/components/delete-form";
import { formatNumber, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import { deleteGrade, setJuryValidated } from "../actions";
import { formatAverage, formatScore } from "../format";
import type { UnitResult, UnitStatus } from "../lib/average";
import type { Grade, SubjectWithGrades, UnitWithGrades } from "../queries";
import { GradeForm } from "./grade-form";

const UNIT_STATUS: Record<UnitStatus, { label: string; tone: BadgeProps["tone"] }> = {
  none: { label: "Pas encore de note", tone: "white" },
  validated: { label: "Validée", tone: "green" },
  jury: { label: "Validée par le jury", tone: "blue" },
  failed: { label: "Non validée", tone: "pink" },
};

function GradeChip({ grade, onEdit }: { grade: Grade; onEdit: () => void }) {
  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={`Modifier la note ${grade.title}`}
      className="inline-flex cursor-pointer flex-col items-start rounded-2xl border-2 bg-background px-3 py-1.5 text-left hover:bg-muted"
    >
      <span className="text-[15px] leading-tight font-extrabold">
        {formatScore(grade.score, grade.out_of)}
        {grade.weight !== 1 && (
          <span className="ml-1 text-xs font-bold text-ink-soft">
            ×{formatNumber(grade.weight)}
          </span>
        )}
      </span>
      <span className="max-w-32 truncate text-xs text-ink-soft">{grade.title}</span>
    </button>
  );
}

function SubjectGrades({
  subject,
  average,
}: {
  subject: SubjectWithGrades;
  average: number | null;
}) {
  // null : rien d'ouvert ; "new" : ajout ; sinon l'identifiant de la note modifiée.
  const [open, setOpen] = useState<string | null>(null);
  const editing = subject.grades.find((grade) => grade.id === open);
  // Une note supprimée disparaît des données : son formulaire se referme de lui-même.
  const showForm = open === "new" || editing !== undefined;

  return (
    <li className="py-4">
      <div className="flex items-center gap-3">
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
          <p className="text-[13px] text-ink-soft">Coef {formatNumber(subject.coefficient)}</p>
        </div>
        <p
          className={cn(
            "text-2xl font-extrabold tracking-tight tabular-nums",
            average !== null && average < 10 && "text-error",
          )}
          aria-label={`Moyenne ${subject.name} : ${formatAverage(average)}`}
        >
          {formatAverage(average)}
        </p>
      </div>

      {showForm ? (
        <div className="mt-3 rounded-3xl border-2 bg-background p-4">
          <GradeForm subjectId={subject.id} grade={editing} onDone={() => setOpen(null)} />
          {editing && (
            <div className="mt-3 border-t-2 border-dashed border-ink/15 pt-2">
              <DeleteForm
                action={deleteGrade}
                id={editing.id}
                label="Supprimer la note"
                message={`Supprimer la note « ${editing.title} » ?`}
                withText
              />
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2 pl-[52px]">
          {subject.grades.map((grade) => (
            <GradeChip key={grade.id} grade={grade} onEdit={() => setOpen(grade.id)} />
          ))}
          <button
            type="button"
            onClick={() => setOpen("new")}
            aria-label={`Ajouter une note en ${subject.name}`}
            className="inline-flex min-h-12 cursor-pointer items-center gap-1.5 rounded-2xl border-2 border-dashed px-3 text-sm font-bold hover:bg-background"
          >
            <Plus className="size-4" strokeWidth={2.6} aria-hidden /> Note
          </button>
        </div>
      )}
    </li>
  );
}

function JuryToggle({ unit }: { unit: UnitWithGrades }) {
  const { pending } = useFormStatus();
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm font-bold">
      <input
        type="checkbox"
        defaultChecked={unit.juryValidated}
        disabled={pending}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="size-5 cursor-pointer accent-ink"
      />
      <Gavel className="size-4" strokeWidth={2.4} aria-hidden />
      Validée par décision du jury
    </label>
  );
}

export function UnitGradesCard({ unit, result }: { unit: UnitWithGrades; result: UnitResult }) {
  const status = UNIT_STATUS[result.status];
  const showJury = result.status === "failed" || result.status === "jury";

  return (
    <section aria-label={unit.name} className="rounded-card border-2 bg-surface p-5 shadow-hard">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {unit.code && <Badge tone="dark">{unit.code}</Badge>}
            <Badge tone="yellow">{plural(unit.ectsCredits, "crédit")} ECTS</Badge>
          </div>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">{unit.name}</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone={status.tone}>{status.label}</Badge>
            {result.status !== "none" && !result.complete && <Badge>Provisoire</Badge>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-ink-soft">Moyenne</p>
          <p
            className={cn(
              "text-[34px] leading-none font-extrabold tracking-[-0.04em] tabular-nums",
              result.status === "failed" && "text-error",
            )}
          >
            {formatAverage(result.average)}
          </p>
        </div>
      </div>

      {showJury && (
        <form
          action={setJuryValidated}
          className="mt-4 rounded-2xl border-2 border-dashed px-4 py-3"
        >
          <input type="hidden" name="id" value={unit.id} />
          <input type="hidden" name="value" value={String(!unit.juryValidated)} />
          <JuryToggle unit={unit} />
          <p className="mt-1 pl-[30px] text-[13px] text-ink-soft">
            À cocher si le conseil a validé l&apos;UE malgré une moyenne sous 10.
          </p>
        </form>
      )}

      {unit.subjects.length === 0 ? (
        <p className="mt-4 text-[15px] text-ink-soft">Aucune matière dans cette UE.</p>
      ) : (
        <ul className="mt-2 divide-y-2 divide-dashed divide-ink/15">
          {unit.subjects.map((subject) => (
            <SubjectGrades
              key={subject.id}
              subject={subject}
              average={result.subjects.find((s) => s.id === subject.id)?.average ?? null}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
