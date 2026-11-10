import { Suspense } from "react";
import { NavLinks, NavLinksView } from "./nav-links";

/** Navigation principale sur mobile : pilule noire flottante en bas de l'écran. */
export function BottomNav() {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 rounded-full bg-ink p-1.5 lg:hidden"
    >
      <Suspense fallback={<NavLinksView variant="bottom" pathname={null} />}>
        <NavLinks variant="bottom" />
      </Suspense>
    </nav>
  );
}
