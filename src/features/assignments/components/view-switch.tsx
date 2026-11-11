import { CalendarDays, List } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Option = { href: string; label: string; icon?: typeof List; selected: boolean };

/** Choix entre deux affichages (liens, pour que le bouton « retour » fonctionne). */
export function Segmented({ label, options }: { label: string; options: Option[] }) {
  return (
    <nav aria-label={label} className="inline-flex shrink-0 rounded-full border-2 bg-surface p-1">
      {options.map(({ href, label: text, icon: Icon, selected }) => (
        <Link
          key={href}
          href={href}
          scroll={false}
          aria-current={selected ? "page" : undefined}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-bold",
            selected ? "bg-ink text-background" : "hover:bg-muted",
          )}
        >
          {Icon && <Icon className="size-4" strokeWidth={2.4} aria-hidden />}
          {text}
        </Link>
      ))}
    </nav>
  );
}

/** « Liste | Calendrier » en haut des pages Devoirs. */
export function AssignmentsViewSwitch({ active }: { active: "liste" | "calendrier" }) {
  return (
    <Segmented
      label="Affichage des devoirs"
      options={[
        { href: "/devoirs", label: "Liste", icon: List, selected: active === "liste" },
        {
          href: "/devoirs/calendrier",
          label: "Calendrier",
          icon: CalendarDays,
          selected: active === "calendrier",
        },
      ]}
    />
  );
}
