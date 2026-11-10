import Link from "next/link";
import { UserRound } from "lucide-react";
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
      <Link
        href="/profil"
        className="mt-auto flex h-12 items-center gap-3 rounded-full border-2 border-transparent px-4 text-[15px] font-bold transition-colors hover:border-ink hover:bg-surface"
      >
        <UserRound className="size-5" strokeWidth={2.1} aria-hidden />
        Mon profil
      </Link>
    </aside>
  );
}
