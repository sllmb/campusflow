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

## Scripts

| Commande               | Rôle                                 |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Serveur de développement             |
| `npm run build`        | Build de production                  |
| `npm run lint`         | ESLint                               |
| `npm run typecheck`    | Vérification TypeScript              |
| `npm run format`       | Formate le code avec Prettier        |
| `npm run format:check` | Vérifie le formatage (sans modifier) |

## Organisation

- `src/app/` : routes uniquement, avec peu de logique.
- `src/features/` : le code métier, regroupé par domaine (matières, devoirs, notes, Pomodoro).
- `src/lib/` : utilitaires partagés (client Supabase, variables d'environnement).
- `supabase/migrations/` : schéma SQL versionné, tables et règles RLS.

## Feuille de route

1. ~~Mise en place~~
2. ~~Design system et layout~~
3. ~~Authentification~~
4. ~~Matières~~
5. ~~Devoirs, projets et examens~~
6. ~~Notes et moyennes~~
7. Dashboard
8. Pomodoro, tests E2E et déploiement sur Vercel
