import { cn } from "@/lib/utils";

type FormAlertProps = { tone: "error" | "success"; children: React.ReactNode };

export function FormAlert({ tone, children }: FormAlertProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-2xl border-2 px-4 py-3 text-sm font-semibold",
        tone === "error" ? "bg-pink" : "bg-green",
      )}
    >
      {children}
    </div>
  );
}
