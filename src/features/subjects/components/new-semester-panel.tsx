"use client";

import { AddPanel } from "./add-panel";
import { SemesterForm } from "./semester-form";

/** « Nouveau semestre » qui se déplie en formulaire (utilisable depuis une page serveur). */
export function NewSemesterPanel({ first = false }: { first?: boolean }) {
  return (
    <AddPanel
      label={first ? "Créer mon premier semestre" : "Nouveau semestre"}
      defaultOpen={first}
      className={first ? undefined : "sm:max-w-md"}
    >
      {(close) => <SemesterForm onDone={first ? undefined : close} />}
    </AddPanel>
  );
}
