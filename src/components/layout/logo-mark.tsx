import { cn } from "@/lib/utils";

/**
 * Pictogramme CampusFlow : tuile jaune, « C » tracé comme l'anneau du minuteur,
 * point bleu du « flow ». Fichiers sources : public/brand/.
 */
export function LogoMark({ className, shadow = true }: { className?: string; shadow?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("size-9 shrink-0", className)}>
      {shadow && <rect x="6" y="6" width="56" height="56" rx="16" fill="var(--ink)" />}
      <rect
        x="2"
        y="2"
        width="56"
        height="56"
        rx="16"
        fill="var(--yellow)"
        stroke="var(--ink)"
        strokeWidth="3"
      />
      <path
        d="M37.9 20.1 A14 14 0 1 0 37.9 39.9"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="42.5" cy="30" r="4.6" fill="var(--blue)" stroke="var(--ink)" strokeWidth="2.5" />
    </svg>
  );
}
