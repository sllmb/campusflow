import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { TimeZoneSync } from "@/components/layout/time-zone-sync";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="mx-auto w-full max-w-6xl min-w-0 flex-1 px-[18px] pt-7 pb-32 lg:px-10 lg:pt-10 lg:pb-12">
        {children}
      </main>
      <BottomNav />
      <TimeZoneSync />
    </div>
  );
}
