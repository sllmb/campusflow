import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const tones = {
  white: "border-2 bg-surface text-ink",
  dark: "bg-ink text-primary",
  yellow: "border-2 bg-yellow text-ink",
  blue: "border-2 bg-blue text-ink",
  green: "border-2 bg-green text-ink",
  pink: "border-2 bg-pink text-ink",
  orange: "border-2 bg-orange text-ink",
} as const;

export type BadgeProps = ComponentProps<"span"> & { tone?: keyof typeof tones };

export function Badge({ className, tone = "white", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs leading-5 font-bold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
