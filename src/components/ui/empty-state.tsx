import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-card border-2 border-dashed bg-surface px-6 py-14 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full border-2 bg-primary shadow-hard-sm">
        <Icon className="size-6" strokeWidth={2.2} aria-hidden />
      </div>
      <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
      <p className="mt-1 max-w-sm text-[15px] text-ink-soft">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
