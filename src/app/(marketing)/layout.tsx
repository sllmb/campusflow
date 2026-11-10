import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { SkipLink } from "@/components/marketing/skip-link";

/** Pages publiques : accueil et pages légales. */
export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <SiteHeader />
      <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-[18px] lg:px-10">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
