import type { ReactNode } from "react";

/** Mise en page des pages légales : titre, date de mise à jour, contenu lisible. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <article className="max-w-3xl py-12 lg:py-20">
      <h1 className="text-[40px] leading-[1.02] font-extrabold tracking-[-0.035em] lg:text-6xl">
        {title}
      </h1>
      <p className="mt-3 text-sm font-semibold text-ink-soft">Dernière mise à jour : {updated}</p>
      <div className="mt-10 grid gap-8 text-[16px] leading-relaxed [&_a]:font-bold [&_a]:underline [&_a]:underline-offset-4 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:tracking-tight [&_li]:ml-5 [&_li]:list-disc [&_section]:grid [&_section]:gap-3 [&_ul]:grid [&_ul]:gap-1.5">
        {children}
      </div>
    </article>
  );
}

/** Information que le propriétaire du site doit fournir avant la mise en ligne publique. */
export function ToFill({ children }: { children: ReactNode }) {
  return (
    <mark className="rounded-md border-2 border-dashed bg-pink px-1.5 py-0.5 font-bold text-ink">
      À compléter : {children}
    </mark>
  );
}
