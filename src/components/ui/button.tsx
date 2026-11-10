import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "border-2 bg-primary text-ink shadow-hard-sm",
  dark: "border-2 bg-ink text-background shadow-hard-sm",
  outline: "border-2 bg-surface text-ink shadow-hard-sm",
  ghost: "text-ink hover:bg-muted",
  danger: "border-2 bg-alert text-ink shadow-hard-sm",
} as const;

const sizes = {
  sm: "h-9 gap-1.5 px-4 text-sm",
  md: "h-11 gap-2 px-5 text-[15px]",
  lg: "h-13 gap-2 px-6 text-base",
  icon: "size-12",
} as const;

type ButtonStyle = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

/** Classes d'un bouton, réutilisables sur un lien. */
export function buttonClasses({ variant = "primary", size = "md" }: ButtonStyle = {}) {
  return cn(
    "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full font-bold whitespace-nowrap transition-[transform,box-shadow,background-color] duration-100 disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-[1.15em] [&_svg]:shrink-0",
    variant !== "ghost" &&
      "hover:-translate-x-px hover:-translate-y-px hover:shadow-hard active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
    variants[variant],
    sizes[size],
  );
}

export type ButtonProps = ComponentProps<"button"> & ButtonStyle;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonClasses({ variant, size }), className)} {...props} />
  );
}

export type ButtonLinkProps = ComponentProps<typeof Link> & ButtonStyle;

/** Lien qui a l'apparence d'un bouton (navigation, pas d'action). */
export function ButtonLink({ className, variant, size, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonClasses({ variant, size }), className)} {...props} />;
}
