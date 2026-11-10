import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const tones = {
  white: "bg-surface",
  yellow: "bg-yellow",
  blue: "bg-blue",
  green: "bg-green",
  pink: "bg-pink",
  orange: "bg-orange",
} as const;

export type CardTone = keyof typeof tones;

export type CardProps = ComponentProps<"div"> & { tone?: CardTone };

/** Carte « widget » : bordure épaisse, grands arrondis, ombre décalée. */
export function Card({ className, tone = "white", ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-card border-2 p-5 text-ink shadow-hard", tones[tone], className)}
      {...props}
    />
  );
}

export function CardLabel({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-sm font-bold", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("text-lg font-extrabold tracking-tight", className)} {...props} />;
}

export function CardValue({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn("text-[44px] leading-none font-extrabold tracking-[-0.04em]", className)}
      {...props}
    />
  );
}
