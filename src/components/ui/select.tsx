import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Liste déroulante native, au style des champs. */
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-12 w-full cursor-pointer appearance-none rounded-2xl border-2 bg-surface pr-11 pl-4 text-[15px] font-medium transition-shadow focus-visible:shadow-hard-sm focus-visible:outline-none aria-invalid:border-error",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2"
        strokeWidth={2.4}
      />
    </div>
  );
}
