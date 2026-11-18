import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { CONTACT_EMAIL } from "@/components/marketing/legal-contact";

export const metadata: Metadata = { title: "Confidentialité" };

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Confidentialité" updated="18 novembre 2026">
      <p className="text-lg font-semibold">
        En bref : tes données servent uniquement à faire fonctionner CampusFlow, et toi seul peux
        les voir.
      </p>

      <section>
        <h2>Responsable du traitement</h2>
        <p>
          Salamba Diène, éditeur de CampusFlow, Dakar, Sénégal. Contact :{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </section>

      <section>
        <h2>Données collectées</h2>
        <ul>
          <li>Ton adresse e-mail et ton prénom, pour créer ton compte.</li>
          <li>
            Ton mot de passe, qui n&apos;est jamais stocké en clair : seule une empreinte chiffrée
            est conservée.
          </li>
          <li>
            Ce que tu saisis dans l&apos;application : semestres, UE, matières, devoirs, examens,
            notes, planning de révisions et sessions de travail.
          </li>
          <li>
            Si tu actives la double authentification : le secret de ton application
            d&apos;authentification, conservé par Supabase.
          </li>
          <li>
            Si tu actives les rappels : l&apos;adresse technique d&apos;abonnement de ton appareil,
            son fuseau horaire et le jour du dernier rappel envoyé.
          </li>
        </ul>
      </section>

      <section>
        <h2>Utilisation</h2>
        <p>
          Ces données servent uniquement à te fournir le service : afficher tes échéances, calculer
          tes moyennes, planifier tes révisions, enregistrer ton temps de travail et t&apos;envoyer
          les rappels que tu as demandés. Elles ne sont ni vendues ni utilisées pour de la
          publicité.
        </p>
      </section>

      <section>
        <h2>Qui y a accès</h2>
        <p>
          Toi seul. Chaque donnée est rattachée à ton compte, et la base de données refuse tout
          accès depuis un autre compte.
        </p>
        <p>
          Pour gérer le service et t&apos;aider en cas de problème, l&apos;éditeur peut consulter la
          liste des comptes : adresse e-mail, prénom, dates d&apos;inscription et de dernière
          connexion, adresse confirmée ou non, double authentification et rappels activés ou non,
          activité récente (oui ou non), ainsi que des chiffres globaux sur l&apos;utilisation du
          service. Il peut suspendre ou supprimer un compte en cas d&apos;abus. Il ne voit jamais le
          contenu de ton compte : tes matières, devoirs, notes, révisions et sessions de travail
          restent visibles par toi seul.
        </p>
        <p>Nos prestataires techniques interviennent sans exploiter tes données :</p>
        <ul>
          <li>
            Supabase : base de données et authentification, sur des serveurs situés dans
            l&apos;Union européenne (Irlande).
          </li>
          <li>Vercel : hébergement du site (États-Unis).</li>
          <li>Google (Gmail) : envoi des e-mails de confirmation et de mot de passe.</li>
          <li>
            Apple, Google ou Mozilla, selon ton navigateur : acheminement des notifications de
            rappel, qui sont chiffrées.
          </li>
        </ul>
        <p>Tes données sont donc hébergées hors du Sénégal, chez ces prestataires.</p>
      </section>

      <section>
        <h2>Cookies et stockage sur ton appareil</h2>
        <p>
          CampusFlow utilise uniquement des cookies nécessaires : ceux qui te gardent connecté, et
          un cookie qui retient ton fuseau horaire pour afficher les bonnes dates. Aucun cookie
          publicitaire ni de mesure d&apos;audience.
        </p>
        <p>
          Ton appareil garde aussi quelques réglages, qui ne quittent pas ton navigateur : le
          minuteur en cours, la dernière durée de deep work choisie et l&apos;aide
          d&apos;installation masquée.
        </p>
      </section>

      <section>
        <h2>Durée de conservation</h2>
        <p>
          Tes données sont conservées tant que ton compte existe et supprimées avec lui.
          L&apos;abonnement aux rappels d&apos;un appareil est supprimé dès que tu les désactives,
          ou quand l&apos;appareil ne peut plus les recevoir.
        </p>
      </section>

      <section>
        <h2>Tes droits</h2>
        <p>
          Conformément à la loi sénégalaise n° 2008-12 du 25 janvier 2008 sur la protection des
          données à caractère personnel, tu peux accéder à tes données, les corriger, t&apos;opposer
          à leur traitement et les faire supprimer.
        </p>
        <p>
          Dans l&apos;application, tu peux consulter et corriger tes données à tout moment, et
          supprimer ton compte avec toutes tes données depuis la page Profil (« Supprimer mon compte
          »). L&apos;effacement est immédiat et définitif.
        </p>
        <p>
          Pour toute autre demande, écris à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          Tu peux aussi adresser une réclamation à la Commission de Protection des Données
          Personnelles (CDP) du Sénégal.
        </p>
      </section>
    </LegalPage>
  );
}
