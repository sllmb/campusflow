"use client";

import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate, plural } from "@/lib/format";
import { deleteSemester } from "../actions";
import type { Semester } from "../queries";
import { DeleteForm } from "./delete-form";
import { IconAction } from "./icon-action";
import { SemesterForm } from "./semester-form";

type SemesterHeaderProps = {
  semester: Semester;
  totalCredits: number;
  unitCount: number;
};

export function SemesterHeader({ semester, totalCredits, unitCount }: SemesterHeaderProps) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="mb-6 lg:mb-8">
      <Link
        href="/matieres"
        className="inline-flex items-center gap-1.5 text-sm font-bold underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-4" strokeWidth={2.4} aria-hidden /> Tous les semestres
      </Link>

      {editing ? (
        <Card className="mt-4 max-w-xl">
          <SemesterForm semester={semester} onDone={() => setEditing(false)} />
        </Card>
      ) : (
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-4xl leading-[1.05] font-extrabold tracking-[-0.03em] lg:text-5xl">
              {semester.name}
            </h1>
            <p className="mt-2 text-[15px] text-ink-soft">
              Du {formatDate(semester.starts_on)} au {formatDate(semester.ends_on)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="yellow">{plural(totalCredits, "crédit")} ECTS</Badge>
              <Badge>{plural(unitCount, "UE", "UE")}</Badge>
            </div>
          </div>
          <div className="flex shrink-0">
            <IconAction aria-label="Modifier le semestre" onClick={() => setEditing(true)}>
              <Pencil strokeWidth={2.2} />
            </IconAction>
            <DeleteForm
              action={deleteSemester}
              id={semester.id}
              label="Supprimer le semestre"
              message={`Supprimer « ${semester.name} », ses UE et toutes leurs matières ? C'est définitif.`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
