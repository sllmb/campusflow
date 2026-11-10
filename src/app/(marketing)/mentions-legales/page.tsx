import type { Metadata } from "next";
import { LegalPage, ToFill } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Mentions légales" };

export default function LegalNoticePage() {
  return (
    <LegalPage title="Mentions légales" updated="10 novembre 2026">
      <section>
        <h2>Éditeur du site</h2>
        <p>
          CampusFlow est édité par <ToFill>nom ou raison sociale</ToFill>, <ToFill>adresse</ToFill>.
        </p>
        <p>
          Contact : <ToFill>adresse e-mail de contact</ToFill>
        </p>
        <p>
          Directeur de la publication : <ToFill>nom</ToFill>
        </p>
      </section>

      <section>
        <h2>Hébergement</h2>
        <p>
          Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723,
          États-Unis.
        </p>
        <p>
          Les données des comptes (authentification et base de données) sont hébergées par Supabase,
          dans la région <ToFill>région du projet Supabase</ToFill>.
        </p>
      </section>

      <section>
        <h2>Propriété intellectuelle</h2>
        <p>
          Les textes, le logo et l&apos;interface de CampusFlow sont protégés. Toute reproduction
          sans autorisation est interdite.
        </p>
      </section>

      <section>
        <h2>Données personnelles</h2>
        <p>
          Le traitement de tes données est décrit dans la{" "}
          <a href="/confidentialite">politique de confidentialité</a>.
        </p>
      </section>
    </LegalPage>
  );
}
