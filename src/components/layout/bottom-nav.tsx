import { Suspense } from "react";
import { RoleNavLinks } from "./role-nav-links";

/** Navigation principale sur mobile : pilule noire flottante en bas de l'écran. */
export function BottomNav() {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 rounded-full bg-ink p-1.5 lg:hidden"
    >
      <Suspense fallback={<div className="h-12" />}>
        <RoleNavLinks variant="bottom" />
      </Suspense>
    </nav>
  );
}
