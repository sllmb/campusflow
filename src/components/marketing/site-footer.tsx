import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { ButtonLink } from "@/components/ui/button";
import { marketingNav } from "./nav-items";

const columns = [
  { title: "Produit", links: marketingNav.map(({ href, label }) => ({ href, label })) },
  {
    title: "Compte",
    links: [
      { href: "/signup", label: "Créer un compte" },
      { href: "/login", label: "Se connecter" },
    ],
  },
  {
    title: "Légal",
    links: [
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/confidentialite", label: "Confidentialité" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-ink text-background">
      <div className="mx-auto max-w-6xl px-[18px] pt-14 pb-8 lg:px-10 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div className="max-w-sm">
            <Logo href="/" />
            <p className="mt-4 text-[15px] opacity-80">
              Matières, devoirs, examens, notes et Pomodoro : l&apos;organisation de tes études, au
              même endroit.
            </p>
            <ButtonLink href="/signup" className="mt-6">
              Créer mon compte
            </ButtonLink>
          </div>

          <nav aria-label="Pied de page" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <h2 className="text-sm font-extrabold tracking-[0.08em] text-primary uppercase">
                  {column.title}
                </h2>
                <ul className="mt-4 grid gap-3">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[15px] font-semibold underline-offset-4 hover:text-primary hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t-2 border-background/20 pt-6 text-sm opacity-80 sm:flex-row sm:justify-between">
          <p>© 2026 CampusFlow</p>
          <p>Fait pour les étudiants.</p>
        </div>
      </div>
    </footer>
  );
}
