import {
  BookOpen,
  ChartColumn,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Timer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Absent de la barre du bas (5 icônes au plus sur téléphone). */
  desktopOnly?: boolean;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/matieres", label: "Matières", icon: BookOpen },
  { href: "/devoirs", label: "Devoirs", icon: ClipboardList },
  { href: "/notes", label: "Notes", icon: GraduationCap },
  { href: "/pomodoro", label: "Pomodoro", icon: Timer },
  { href: "/statistiques", label: "Statistiques", icon: ChartColumn, desktopOnly: true },
];

export function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}
