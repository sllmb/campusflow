"use client";

import { AddPanel } from "@/features/subjects/components/add-panel";
import type { SubjectOptionGroup } from "../queries";
import { AssignmentForm } from "./assignment-form";

export function NewAssignmentPanel({
  groups,
  defaultDue,
}: {
  groups: SubjectOptionGroup[];
  defaultDue: string;
}) {
  return (
    <AddPanel label="Ajouter un devoir, un projet ou un examen" className="shadow-none">
      {(close) => <AssignmentForm groups={groups} defaultDue={defaultDue} onDone={close} />}
    </AddPanel>
  );
}
