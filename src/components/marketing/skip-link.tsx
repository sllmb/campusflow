/** Lien « Aller au contenu » : visible seulement au clavier, pour sauter la navbar. */
export function SkipLink({ href = "#contenu" }: { href?: string }) {
  return (
    <a
      href={href}
      className="sr-only z-[60] rounded-full border-2 bg-primary px-4 py-2 font-bold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      Aller au contenu
    </a>
  );
}
