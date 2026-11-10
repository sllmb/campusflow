import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "h-12 w-full rounded-2xl border-2 bg-surface px-4 text-[15px] font-medium transition-shadow placeholder:font-normal placeholder:text-ink-soft focus-visible:shadow-hard-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-error aria-invalid:shadow-[3px_3px_0_var(--error)]",
        className,
      )}
      {...props}
    />
  );
}
