import { Suspense } from "react";
import { Logo } from "./logo";
import { NavLinks, NavLinksView } from "./nav-links";

/** Navigation principale sur ordinateur (masquée sur mobile). */
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-68 shrink-0 flex-col border-r-2 px-5 py-7 lg:flex">
      <div className="px-1">
        <Logo />
      </div>
      <nav aria-label="Navigation principale" className="mt-10">
        <Suspense fallback={<NavLinksView variant="sidebar" pathname={null} />}>
          <NavLinks variant="sidebar" />
        </Suspense>
      </nav>
    </aside>
  );
}
