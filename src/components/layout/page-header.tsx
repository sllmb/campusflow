import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({ title, eyebrow, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4 lg:mb-8">
      <div className="min-w-0">
        {eyebrow && <p className="text-[13px] font-bold tracking-[0.08em] uppercase">{eyebrow}</p>}
        <h1 className="mt-1 text-4xl leading-[1.05] font-extrabold tracking-[-0.03em] lg:text-5xl">
          {title}
        </h1>
        {description && <p className="mt-2 text-[15px] text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}
