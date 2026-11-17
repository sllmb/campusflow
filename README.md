# CampusFlow

Application d'organisation pour étudiants : matières, devoirs et examens, notes et moyennes, Pomodoro.

Stack : Next.js 16 (App Router, Server Actions), TypeScript, Tailwind CSS 4, Supabase (Postgres + Auth + RLS), Zod.

## Démarrer

Prérequis : Node.js 20.9 ou plus récent, et un projet Supabase (l'offre gratuite suffit).

```bash
npm install
cp .env.example .env.local   # puis remplir avec les clés du projet Supabase
npm run dev                  # http://localhost:3000
```

Les clés se trouvent dans Supabase, sous **Project Settings > API Keys** : l'URL du projet et la clé
publique (`publishable` ou `anon`). La clé `service_role` ne doit jamais être mise dans ce projet.

## Base de données

Le schéma est versionné dans `supabase/migrations/` : chaque fichier SQL s'applique une fois, dans
l'ordre des noms. Deux façons de l'appliquer :

- **Depuis le navigateur** : Supabase > **SQL Editor** > **New query**, coller le contenu du fichier,
  puis **Run**.
- **Avec la CLI** : `npx supabase link --project-ref <id>` puis `npx supabase db push`.

Règle du projet : toute nouvelle table active la RLS dans la même migration.

### Deux projets Supabase : production et test

| Projet            | Utilisé par                                             | Anti-robots |
| ----------------- | ------------------------------------------------------- | ----------- |
| `campusflow`      | le site en ligne (variables de Vercel)                  | Turnstile   |
| `campusflow-test` | `npm run dev` sur ton ordi et les tests de bout en bout | non         |

`.env.local` pointe toujours vers **le projet de test** : les essais en local ne touchent jamais
les vraies données. Le projet de test n'envoie pas d'e-mail (« Confirm email » désactivé).

Chaque nouvelle migration s'applique **aux deux projets** : d'abord au test, puis à la
production avant de fusionner.

## Application installable (PWA)

- Manifeste : `src/app/manifest.ts` (nom, plein écran, couleurs, icônes de `public/brand/`).
- Service worker : `public/sw.js`, enregistré en production. Il ne met en cache que la page
  `/offline`, les icônes et les fichiers versionnés de Next.js ; **jamais** les pages ni les
  données de l'utilisateur. Sans réseau, la navigation affiche `/offline`.
- Après une modification de `public/sw.js`, incrémenter `VERSION` pour vider l'ancien cache.
- Installation : sur iPhone, Safari → Partager → « Sur l'écran d'accueil » (l'accueil de l'app
  l'explique) ; sur Android, bouton « Installer ».

## Double authentification

Facultative, activée depuis la page Profil (application d'authentification, codes TOTP).
Une fois activée, le code est demandé après le mot de passe (`/verification`), et la base
refuse toute lecture ou écriture tant qu'il n'a pas été saisi (politiques RLS restrictives,
migration `20261113090000_enforce_mfa.sql`).

En cas de perte du téléphone : Supabase → Authentication → Users → le compte → retirer le
facteur MFA.

## Anti-robots (Cloudflare Turnstile)

L'inscription, la connexion et le mot de passe oublié affichent la vérification Turnstile quand
`NEXT_PUBLIC_TURNSTILE_SITE_KEY` est défini (production seulement). Le jeton est vérifié **par
Supabase** (Authentication > Attack Protection, avec la clé secrète de Turnstile) : un robot ne
peut pas contourner l'app en appelant Supabase directement.

Ordre de mise en place : 1) clé de site dans Vercel et déploiement ; 2) seulement ensuite,
activation dans Supabase. Dans l'autre ordre, plus personne ne peut se connecter.

## Rappels du matin

Chaque matin (Vercel Cron, `vercel.json`, 8 h UTC = 8 h au Sénégal), `/api/rappels` envoie à chaque
appareil abonné un résumé : échéances du jour, révisions, examens du lendemain, retards. Rien
n'est envoyé s'il n'y a rien à dire, et jamais deux fois le même jour.

Variables à définir sur Vercel (Settings > Environment Variables), jamais dans le code :

| Variable              | Rôle                                                                  |
| --------------------- | --------------------------------------------------------------------- |
| `SUPABASE_SECRET_KEY` | Lire les échéances de tous les abonnés (contourne la RLS).            |
| `VAPID_PRIVATE_KEY`   | Signer les notifications (clé publique : `src/features/reminders`).   |
| `CRON_SECRET`         | Mot de passe que Vercel Cron envoie ; sans lui, `/api/rappels` : 401. |

Un appareil n'est prévenu que s'il est au moins 8 h dans **son** fuseau (`REMINDER_HOUR`). Avec
le réveil quotidien de l'offre gratuite, c'est 8 h au Sénégal, plus tard à l'est, et pas du
tout à l'ouest (il y fait encore nuit au passage du réveil). Pour des étudiants à l'étranger, passer à un réveil toutes les
heures (GitHub Actions, ou Vercel Pro) : chacun sera prévenu à 8 h chez lui, sans changer le code.

Sur iPhone, les notifications ne marchent que dans l'app installée (iOS 16.4 ou plus).

## E-mails

Les e-mails d'authentification partent par un SMTP personnalisé (Gmail, avec un mot de passe
d'application), configuré dans Supabase → Authentication → Emails → SMTP Settings. Sans nom de
domaine, ils arrivent souvent dans les spams : l'app le rappelle après l'inscription et le mot de
passe oublié. Solution durable : un domaine et un service d'envoi (Resend…) avec SPF et DKIM. Les modèles français sont dans
`supabase/templates/` (`confirm-signup.html` pour « Confirm signup », `reset-password.html`
pour « Reset password »), à coller dans Supabase → Authentication → Emails → Templates.

Mot de passe oublié : `/mot-de-passe-oublie` envoie le lien, qui passe par `/auth/confirm` puis
`/nouveau-mot-de-passe`. Avec la 2FA, le code est demandé avant, puis l'utilisateur revient sur
cette page (paramètre `next`, contrôlé par `safeNext`).

## Scripts

| Commande               | Rôle                                 |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Serveur de développement             |
| `npm run build`        | Build de production                  |
| `npm run lint`         | ESLint                               |
| `npm run typecheck`    | Vérification TypeScript              |
| `npm run format`       | Formate le code avec Prettier        |
| `npm run format:check` | Vérifie le formatage (sans modifier) |

## Tests

- **Unitaires** (`npm test`) : calcul des moyennes, classement des échéances, minuteur.
- **De bout en bout** (`npm run build && npm run e2e`) : Playwright, sur un écran d'iPhone 13.
  Les tests publics tournent toujours. Le parcours complet (matières, devoir, notes, deep work,
  accueil) a besoin d'un compte de test confirmé :

  ```bash
  E2E_EMAIL=test@campusflow.local E2E_PASSWORD=... npm run e2e
  ```

  Le compte vient du projet Supabase **de test** (jamais de la production, protégée par
  Turnstile). Il crée son propre semestre puis le supprime. Premier lancement : `npx playwright install chromium`.

- **Intégration continue** : à chaque pull request, GitHub Actions lance lint, types, formatage,
  tests unitaires et build.

## Organisation

- `src/app/` : routes uniquement, avec peu de logique.
- `src/features/` : le code métier, regroupé par domaine (matières, devoirs, notes, Pomodoro).
- `src/lib/` : utilitaires partagés (client Supabase, variables d'environnement).
- `supabase/migrations/` : schéma SQL versionné, tables et règles RLS.
- `docs/` : cahier des charges, modèle de données, cas d'utilisation et séquences
  ([sommaire](docs/README.md)).

## Feuille de route

1. ~~Mise en place~~
2. ~~Design system et layout~~
3. ~~Authentification~~
4. ~~Matières~~
5. ~~Devoirs, projets et examens~~
6. ~~Notes et moyennes~~
7. ~~Dashboard~~
8. ~~Pomodoro, tests E2E et déploiement sur Vercel~~ → **v0.1.0**
9. ~~Accueil public, logo, double authentification, PWA, mot de passe oublié~~ → **v1.0.0**
10. ~~Calendrier, statistiques, deep work libre, planning de révisions, rappels du matin~~ →
    **v1.1.0**
11. ~~Anti-robots, pages légales, base de test séparée~~ → **v1.2.0**

Le détail de chaque version est dans le [journal des versions](CHANGELOG.md).
