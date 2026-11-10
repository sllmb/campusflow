import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Petit bouton rond avec une icône (modifier, supprimer). `aria-label` obligatoire. */
export function IconAction({
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { "aria-label": string }) {
  return (
    <button
      type={type}
      className={cn(
        "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors hover:border-ink hover:bg-surface [&_svg]:size-[18px]",
        className,
      )}
      {...props}
    />
  );
}
