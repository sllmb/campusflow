import Link from "next/link";
import { LogoMark } from "./logo-mark";

export function Logo({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label="CampusFlow, accueil">
      <LogoMark />
      <span className="text-xl font-extrabold tracking-tight">CampusFlow</span>
    </Link>
  );
}
