import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { getAdminAccess } from "../queries";

/**
 * Seconde ligne de défense des pages admin (le proxy renvoie déjà 404 aux autres) : rien
 * n'est affiché sans le rôle admin, et sans code 2FA on invite à l'activer.
 */
export async function AdminGate({ children }: { children: React.ReactNode }) {
  const access = await getAdminAccess();
  if (access === "denied") notFound();
  if (access === "needs-2fa") {
    return (
      <Card className="max-w-xl">
        <CardTitle>Double authentification requise</CardTitle>
        <p className="mt-2 text-[15px] text-ink-soft">
          L&apos;espace admin n&apos;est accessible qu&apos;avec la double authentification activée
          et le code saisi.
        </p>
        <ButtonLink href="/profil" variant="dark" className="mt-4">
          Activer la double authentification
        </ButtonLink>
      </Card>
    );
  }
  return <>{children}</>;
}
