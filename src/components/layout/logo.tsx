import Link from "next/link";

export function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground"
      >
        C
      </span>
      <span className="text-lg font-bold tracking-tight">CampusFlow</span>
    </Link>
  );
}
