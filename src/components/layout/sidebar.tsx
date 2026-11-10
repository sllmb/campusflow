import { Suspense } from "react";
import { Logo } from "./logo";
import { NavLinks, NavLinksView } from "./nav-links";

/** Navigation principale sur ordinateur (masquée sur mobile). */
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-surface px-4 py-6 lg:flex">
      <div className="px-2">
        <Logo />
      </div>
      <nav aria-label="Navigation principale" className="mt-8">
        <Suspense fallback={<NavLinksView variant="sidebar" pathname={null} />}>
          <NavLinks variant="sidebar" />
        </Suspense>
      </nav>
    </aside>
  );
}
