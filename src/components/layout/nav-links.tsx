"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isActive, navItems } from "./nav-items";

type Variant = "sidebar" | "bottom";

/** Liens de navigation avec l'état actif (lit l'URL courante). */
export function NavLinks({ variant }: { variant: Variant }) {
  const pathname = usePathname();
  return <NavLinksView variant={variant} pathname={pathname} />;
}

/** Rendu sans état actif, affiché pendant le chargement (fallback de Suspense). */
export function NavLinksView({ variant, pathname }: { variant: Variant; pathname: string | null }) {
  return (
    <ul className={variant === "sidebar" ? "flex flex-col gap-1" : "grid grid-cols-5"}>
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                variant === "sidebar"
                  ? "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
                  : "flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors",
                variant === "sidebar" &&
                  (active
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"),
                variant === "bottom" && (active ? "text-primary" : "text-muted-foreground"),
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
