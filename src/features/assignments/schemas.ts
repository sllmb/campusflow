import { z } from "zod";

export const assignmentSchema = z.object({
  kind: z.enum(["homework", "project", "exam"], { error: "Choisis un type." }),
  title: z.string().trim().min(1, "Donne un titre.").max(120, "120 caractères maximum."),
  subjectId: z.uuid({ error: "Choisis une matière." }),
  dueAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, {
      error: "Indique la date et l'heure de l'échéance.",
    }),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  notes: z
    .string()
    .trim()
    .max(2000, "2000 caractères maximum.")
    .transform((value) => value || null),
});

export type AssignmentField =
  "kind" | "title" | "subjectId" | "dueAt" | "priority" | "status" | "notes";
