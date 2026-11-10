import { Suspense } from "react";
import { NavLinks, NavLinksView } from "./nav-links";

/** Navigation principale sur mobile, fixée en bas de l'écran. */
export function BottomNav() {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <Suspense fallback={<NavLinksView variant="bottom" pathname={null} />}>
        <NavLinks variant="bottom" />
      </Suspense>
    </nav>
  );
}
