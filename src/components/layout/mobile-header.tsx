import { Logo } from "./logo";

/** Barre du haut sur mobile (la sidebar la remplace sur ordinateur). */
export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b bg-background/95 px-4 backdrop-blur lg:hidden">
      <Logo />
    </header>
  );
}
