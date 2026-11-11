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
  if (variant === "bottom") {
    return (
      <ul className="flex items-center justify-between">
        {navItems
          .filter((item) => !item.desktopOnly)
          .map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  aria-label={active ? undefined : label}
                  className={cn(
                    "flex h-12 items-center justify-center rounded-full transition-colors",
                    active
                      ? "gap-2 bg-primary px-4 text-sm font-bold text-ink"
                      : "w-12 text-background hover:text-primary",
                  )}
                >
                  <Icon className="size-[22px]" strokeWidth={2.1} aria-hidden />
                  {active && label}
                </Link>
              </li>
            );
          })}
      </ul>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-12 items-center gap-3 rounded-full border-2 px-4 text-[15px] font-bold transition-[background-color,box-shadow]",
                active
                  ? "bg-primary shadow-hard-sm"
                  : "border-transparent hover:border-ink hover:bg-surface",
              )}
            >
              <Icon className="size-5" strokeWidth={2.1} aria-hidden />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
