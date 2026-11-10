import type { BadgeProps } from "@/components/ui/badge";
import type { Database } from "@/types/database";

type Row = Database["public"]["Tables"]["assignments"]["Row"];
export type AssignmentKind = Row["kind"];
export type AssignmentStatus = Row["status"];
export type AssignmentPriority = Row["priority"];

export const KINDS: {
  value: AssignmentKind;
  label: string;
  plural: string;
  tone: BadgeProps["tone"];
}[] = [
  { value: "homework", label: "Devoir", plural: "Devoirs", tone: "blue" },
  { value: "project", label: "Projet", plural: "Projets", tone: "orange" },
  { value: "exam", label: "Examen", plural: "Examens", tone: "dark" },
];

export const STATUSES: { value: AssignmentStatus; label: string }[] = [
  { value: "todo", label: "À faire" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Terminé" },
];

export const PRIORITIES: { value: AssignmentPriority; label: string }[] = [
  { value: "low", label: "Basse" },
  { value: "normal", label: "Normale" },
  { value: "high", label: "Haute" },
];

export function kindInfo(kind: AssignmentKind) {
  return KINDS.find((item) => item.value === kind) ?? KINDS[0];
}

export function statusLabel(status: AssignmentStatus) {
  return STATUSES.find((item) => item.value === status)?.label ?? status;
}
