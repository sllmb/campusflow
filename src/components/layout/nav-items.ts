import {
  BookOpen,
  ChartColumn,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Timer,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Absent de la barre du bas (5 icônes au plus sur téléphone). */
  desktopOnly?: boolean;
  /** Absent du menu latéral (qui a déjà son lien « Mon profil »). */
  mobileOnly?: boolean;
  /** Actif seulement sur cette adresse exacte (pas sur ses sous-pages). */
  exact?: boolean;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/matieres", label: "Matières", icon: BookOpen },
  { href: "/devoirs", label: "Devoirs", icon: ClipboardList },
  { href: "/notes", label: "Notes", icon: GraduationCap },
  { href: "/pomodoro", label: "Pomodoro", icon: Timer },
  { href: "/statistiques", label: "Statistiques", icon: ChartColumn, desktopOnly: true },
];

/** Menu du compte admin : un outil de gestion, sans les pages d'étudiant. */
export const adminNavItems: NavItem[] = [
  { href: "/admin", label: "Tableau", icon: ShieldCheck, exact: true },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { href: "/profil", label: "Profil", icon: UserRound, mobileOnly: true },
];

export function isActive(pathname: string | null, href: string, exact = false) {
  if (!pathname) return false;
  return pathname === href || (!exact && pathname.startsWith(`${href}/`));
}
