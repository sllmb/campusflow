import type { ReactNode } from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  id: string;
  eyebrow: string;
  eyebrowTone?: BadgeProps["tone"];
  title: ReactNode;
  description?: ReactNode;
  className?: string;
};

export function SectionHeading({
  id,
  eyebrow,
  eyebrowTone = "white",
  title,
  description,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <Badge tone={eyebrowTone}>{eyebrow}</Badge>
      <h2
        id={id}
        className="mt-3 text-[34px] leading-[1.02] font-extrabold tracking-[-0.035em] lg:text-5xl"
      >
        {title}
      </h2>
      {description && <p className="mt-3 text-[17px] opacity-80">{description}</p>}
    </div>
  );
}
