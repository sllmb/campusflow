"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Logo } from "@/components/layout/logo";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { marketingNav } from "./nav-items";

/**
 * En-tête des pages publiques.
 * - Reste en haut de l'écran ; une bordure apparaît dès qu'on fait défiler.
 * - Ordinateur : liens vers les sections + « Se connecter » et « Créer un compte ».
 * - Mobile : « Créer un compte » + bouton menu qui ouvre un panneau.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuId = useId();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b-2 bg-background/90 backdrop-blur-md transition-colors",
        scrolled || open ? "border-ink" : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-[18px] lg:px-10">
        <Logo href="/" />

        <nav aria-label="Navigation du site" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {marketingNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-full border-2 border-transparent px-4 py-2 text-[15px] font-bold transition-colors hover:border-ink hover:bg-surface"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ButtonLink href="/login" variant="ghost" size="sm" className="hidden lg:inline-flex">
            Se connecter
          </ButtonLink>
          <ButtonLink href="/signup" size="sm" className="max-[359px]:hidden">
            <span className="sm:hidden">S&apos;inscrire</span>
            <span className="hidden sm:inline">Créer un compte</span>
          </ButtonLink>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOpen((value) => !value)}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full border-2 bg-surface shadow-hard-sm lg:hidden"
          >
            {open ? (
              <X className="size-5" strokeWidth={2.4} />
            ) : (
              <Menu className="size-5" strokeWidth={2.4} />
            )}
          </button>
        </div>
      </div>

      <div
        id={menuId}
        hidden={!open}
        className="border-t-2 bg-background px-[18px] pt-4 pb-6 lg:hidden"
      >
        <nav aria-label="Navigation du site (mobile)">
          <ul className="grid gap-2">
            {marketingNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={close}
                  className="flex h-14 items-center rounded-2xl border-2 bg-surface px-5 text-lg font-extrabold"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-4 grid gap-3">
          <ButtonLink href="/signup" size="lg" onClick={close}>
            Créer un compte
          </ButtonLink>
          <ButtonLink href="/login" variant="outline" size="lg" onClick={close}>
            Se connecter
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
