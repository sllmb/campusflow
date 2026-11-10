import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-2xl border-2 bg-surface px-4 py-3 text-[15px] font-medium transition-shadow placeholder:font-normal placeholder:text-ink-soft focus-visible:shadow-hard-sm focus-visible:outline-none aria-invalid:border-error",
        className,
      )}
      {...props}
    />
  );
}
