/** Classes des 8 couleurs de matières (écrites en entier pour que Tailwind les génère). */
export const SUBJECT_COLORS = [
  { value: 1, label: "Bleu", className: "bg-subject-1" },
  { value: 2, label: "Vert", className: "bg-subject-2" },
  { value: 3, label: "Jaune", className: "bg-subject-3" },
  { value: 4, label: "Rose", className: "bg-subject-4" },
  { value: 5, label: "Orange", className: "bg-subject-5" },
  { value: 6, label: "Violet", className: "bg-subject-6" },
  { value: 7, label: "Turquoise", className: "bg-subject-7" },
  { value: 8, label: "Corail", className: "bg-subject-8" },
] as const;

export function subjectColorClass(color: number) {
  return SUBJECT_COLORS.find((item) => item.value === color)?.className ?? "bg-subject-1";
}

/** Première couleur pas encore utilisée ; si les 8 sont prises, on recommence le cycle. */
export function nextSubjectColor(usedColors: number[]) {
  const free = SUBJECT_COLORS.find((item) => !usedColors.includes(item.value));
  return free ? free.value : (usedColors.length % SUBJECT_COLORS.length) + 1;
}
