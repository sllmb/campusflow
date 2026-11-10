import type { Metadata } from "next";
import { LegalPage, ToFill } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Confidentialité" };

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Confidentialité" updated="10 novembre 2026">
      <p className="text-lg font-semibold">
        En bref : tes données servent uniquement à faire fonctionner CampusFlow, et toi seul peux
        les voir.
      </p>

      <section>
        <h2>Données collectées</h2>
        <ul>
          <li>Ton adresse e-mail et ton prénom, pour créer ton compte.</li>
          <li>
            Ton mot de passe, qui n&apos;est jamais stocké en clair : seule une empreinte chiffrée
            est conservée.
          </li>
          <li>
            Ce que tu saisis dans l&apos;application : matières, devoirs, examens, notes et sessions
            de travail.
          </li>
        </ul>
      </section>

      <section>
        <h2>Utilisation</h2>
        <p>
          Ces données servent uniquement à te fournir le service : afficher tes échéances, calculer
          tes moyennes, enregistrer ton temps de travail. Elles ne sont ni vendues ni utilisées pour
          de la publicité.
        </p>
      </section>

      <section>
        <h2>Qui y a accès</h2>
        <p>
          Toi seul. Chaque donnée est rattachée à ton compte, et la base de données refuse tout
          accès depuis un autre compte.
        </p>
        <p>
          Nos prestataires techniques hébergent les données sans les exploiter : Supabase (base de
          données et authentification) et Vercel (hébergement du site).
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          CampusFlow utilise uniquement les cookies nécessaires pour te garder connecté. Aucun
          cookie publicitaire ni de mesure d&apos;audience.
        </p>
      </section>

      <section>
        <h2>Durée de conservation</h2>
        <p>Tes données sont conservées tant que ton compte existe et supprimées avec lui.</p>
      </section>

      <section>
        <h2>Tes droits</h2>
        <p>
          Tu peux consulter, corriger ou supprimer tes données, et demander la suppression de ton
          compte, en écrivant à <ToFill>adresse e-mail de contact</ToFill>.
        </p>
      </section>
    </LegalPage>
  );
}
