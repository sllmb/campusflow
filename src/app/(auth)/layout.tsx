import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col items-center px-[18px] py-10">
      <Logo />
      <main className="mt-10 w-full max-w-md">{children}</main>
    </div>
  );
}
