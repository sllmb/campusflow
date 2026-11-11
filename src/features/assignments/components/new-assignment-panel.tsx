"use client";

import { AddPanel } from "@/features/subjects/components/add-panel";
import type { SubjectOptionGroup } from "../queries";
import { AssignmentForm } from "./assignment-form";

export function NewAssignmentPanel({
  groups,
  defaultDue,
  defaultOpen = false,
  label = "Ajouter un devoir, un projet ou un examen",
}: {
  groups: SubjectOptionGroup[];
  defaultDue: string;
  /** Ouvert d'emblée (lien « + » de l'accueil). */
  defaultOpen?: boolean;
  label?: string;
}) {
  return (
    <AddPanel label={label} className="shadow-none" defaultOpen={defaultOpen}>
      {(close) => <AssignmentForm groups={groups} defaultDue={defaultDue} onDone={close} />}
    </AddPanel>
  );
}
