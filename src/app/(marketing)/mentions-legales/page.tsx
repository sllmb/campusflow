import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { CONTACT_EMAIL } from "@/components/marketing/legal-contact";

export const metadata: Metadata = { title: "Mentions légales" };

export default function LegalNoticePage() {
  return (
    <LegalPage title="Mentions légales" updated="17 novembre 2026">
      <section>
        <h2>Éditeur du site</h2>
        <p>
          CampusFlow est un projet étudiant, gratuit et non commercial, édité par Salamba Diène,
          Dakar, Sénégal.
        </p>
        <p>
          Contact : <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
        <p>Directeur de la publication : Salamba Diène.</p>
      </section>

      <section>
        <h2>Hébergement</h2>
        <p>
          Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723,
          États-Unis.
        </p>
        <p>
          Les comptes et les données (authentification et base de données) sont hébergés par
          Supabase Inc., sur des serveurs situés dans l&apos;Union européenne (Irlande).
        </p>
        <p>
          Les e-mails du service (confirmation d&apos;inscription, mot de passe) sont envoyés par
          Gmail (Google).
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

      <section>
        <h2>Droit applicable</h2>
        <p>Le site et ces mentions sont soumis au droit sénégalais.</p>
      </section>
    </LegalPage>
  );
}
