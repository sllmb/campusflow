import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/** Élément introuvable dans l'app (supprimé, ou appartenant à un autre compte). */
export default function AppNotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Introuvable"
      description="Cet élément n'existe pas ou a été supprimé."
      action={<ButtonLink href="/dashboard">Retour à l&apos;accueil</ButtonLink>}
    />
  );
}
