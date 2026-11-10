import Link from "next/link";

export function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="flex size-9 items-center justify-center rounded-xl border-2 bg-primary text-base font-extrabold shadow-hard-sm"
      >
        C
      </span>
      <span className="text-xl font-extrabold tracking-tight">CampusFlow</span>
    </Link>
  );
}
