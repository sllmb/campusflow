import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CampusFlow",
    template: "%s · CampusFlow",
  },
  description: "L'organisation de tes études : matières, devoirs, notes et Pomodoro.",
  applicationName: "CampusFlow",
  // Ouverture en plein écran depuis l'écran d'accueil de l'iPhone.
  appleWebApp: { capable: true, title: "CampusFlow", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#f6f4ec",
  // Utilise tout l'écran (encoche, barre d'accueil) ; les marges de sécurité sont gérées en CSS.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${bricolage.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
