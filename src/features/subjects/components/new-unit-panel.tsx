"use client";

import { AddPanel } from "./add-panel";
import { UnitForm } from "./unit-form";

/** « Ajouter une UE » qui se déplie en formulaire (utilisable depuis une page serveur). */
export function NewUnitPanel({
  semesterId,
  first = false,
}: {
  semesterId: string;
  first?: boolean;
}) {
  return (
    <AddPanel
      label={first ? "Ajouter ma première UE" : "Ajouter une UE"}
      defaultOpen={first}
      className="self-start"
    >
      {(close) => <UnitForm semesterId={semesterId} onDone={first ? undefined : close} />}
    </AddPanel>
  );
}
