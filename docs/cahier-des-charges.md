# Cahier des charges

État au 11 novembre 2026, version 1.0.0 en production.

## 1. Contexte

Un étudiant jongle entre plusieurs outils pour suivre ses cours : un agenda pour les rendus, un
tableur pour les moyennes, une application de minuteur pour réviser. Ces outils ne se parlent
pas, et aucun ne connaît les règles du système LMD (UE, crédits ECTS, compensation).

CampusFlow réunit ces besoins dans une seule application web, pensée d'abord pour le téléphone.

## 2. Objectifs

1. Savoir à tout moment **ce qu'il reste à rendre** et dans quel ordre.
2. Connaître **sa moyenne réelle** et les crédits acquis, calculés selon les règles LMD.
3. **Mesurer son temps de travail** par matière.
4. Garder des **données privées et sûres** : personne d'autre que l'étudiant n'y a accès.

## 3. Utilisateurs

| Acteur   | Description                                                           |
| -------- | --------------------------------------------------------------------- |
| Visiteur | Personne non connectée : voit la page d'accueil et les pages légales. |
| Étudiant | Personne inscrite et connectée : utilise toutes les fonctionnalités.  |

Il n'y a pas de rôle administrateur dans l'application : chaque étudiant ne gère que ses données.

## 4. Exigences fonctionnelles

### Comptes

| Id    | Exigence                                                                     | Version |
| ----- | ---------------------------------------------------------------------------- | ------- |
| EF-01 | S'inscrire avec un nom, un e-mail et un mot de passe (8 caractères minimum). | 0.1     |
| EF-02 | Confirmer son adresse par un lien reçu par e-mail.                           | 0.1     |
| EF-03 | Se connecter, se déconnecter.                                                | 0.1     |
| EF-04 | Réinitialiser un mot de passe oublié, modifier son mot de passe.             | 1.0     |
| EF-05 | Activer ou désactiver la double authentification par application (TOTP).     | 1.0     |
| EF-06 | Modifier son nom affiché.                                                    | 0.1     |
| EF-07 | Supprimer définitivement son compte et toutes ses données.                   | 1.0     |

### Organisation des cours

| Id    | Exigence                                                                  | Version |
| ----- | ------------------------------------------------------------------------- | ------- |
| EF-10 | Créer, modifier, supprimer des semestres (nom, dates de début et de fin). | 0.1     |
| EF-11 | Créer des UE dans un semestre, avec code facultatif et crédits ECTS.      | 0.1     |
| EF-12 | Créer des matières dans une UE, avec coefficient et couleur (8 au choix). | 0.1     |

### Devoirs

| Id    | Exigence                                                                    | Version |
| ----- | --------------------------------------------------------------------------- | ------- |
| EF-20 | Ajouter un devoir, un projet ou un examen à une matière, avec une échéance. | 0.1     |
| EF-21 | Suivre son statut (à faire, en cours, terminé) et sa priorité.              | 0.1     |
| EF-22 | Voir les devoirs en retard et à venir, à l'heure du fuseau de l'étudiant.   | 0.1     |

### Notes et moyennes

| Id    | Exigence                                                                                      | Version |
| ----- | --------------------------------------------------------------------------------------------- | ------- |
| EF-30 | Saisir une note avec son barème (sur 20 par défaut) et son poids.                             | 0.1     |
| EF-31 | Calculer la moyenne de chaque matière, ramenée sur 20.                                        | 0.1     |
| EF-32 | Calculer la moyenne de chaque UE, pondérée par les coefficients des matières.                 | 0.1     |
| EF-33 | Valider une UE si sa moyenne est ≥ 10 (compensation entre matières), ou par décision du jury. | 0.1     |
| EF-34 | Calculer la moyenne du semestre, pondérée par les crédits ECTS des UE.                        | 0.1     |
| EF-35 | Valider le semestre si sa moyenne est ≥ 10 : il donne alors tous ses crédits.                 | 0.1     |

Le seuil de 10 s'applique à la moyenne arrondie au centième, celle qui est affichée.

### Concentration

| Id    | Exigence                                                           | Version |
| ----- | ------------------------------------------------------------------ | ------- |
| EF-40 | Lancer un Pomodoro (travail et pauses en alternance).              | 0.1     |
| EF-41 | Lancer une session de deep work continue de 2 h ou 4 h.            | 0.1     |
| EF-42 | Rattacher une session à une matière (facultatif) et l'enregistrer. | 0.1     |

### Tableau de bord

| Id    | Exigence                                                                                    | Version |
| ----- | ------------------------------------------------------------------------------------------- | ------- |
| EF-50 | Afficher le prochain rendu, la moyenne, le temps de concentration du jour et les échéances. | 0.1     |

## 5. Exigences non fonctionnelles

| Id     | Domaine         | Exigence                                                                                           |
| ------ | --------------- | -------------------------------------------------------------------------------------------------- |
| ENF-01 | Sécurité        | Chaque table est protégée par la RLS : un étudiant n'accède qu'à ses propres lignes.               |
| ENF-02 | Sécurité        | Avec la 2FA activée, la base refuse tout accès tant que le code n'est pas saisi.                   |
| ENF-03 | Sécurité        | En-têtes de sécurité (CSP, `X-Frame-Options`, `Referrer-Policy`) et redirections limitées au site. |
| ENF-04 | Confidentialité | Aucune page contenant des données personnelles n'est mise en cache.                                |
| ENF-05 | Confidentialité | L'étudiant peut supprimer son compte et toutes ses données lui-même.                               |
| ENF-06 | Mobile          | Interface conçue d'abord pour le téléphone ; installable sur l'écran d'accueil (PWA).              |
| ENF-07 | Langue          | Interface en français, tutoiement.                                                                 |
| ENF-08 | Dates           | Les échéances sont stockées en UTC et affichées dans le fuseau horaire de l'étudiant.              |
| ENF-09 | Accessibilité   | Navigation au clavier, libellés pour les lecteurs d'écran, contrastes suffisants.                  |
| ENF-10 | Qualité         | Chaque modification passe par une pull request et une CI verte (lint, types, tests, build).        |

## 6. Contraintes

- **Budget nul** : offres gratuites de Vercel et Supabase, envoi d'e-mails par le SMTP de Gmail.
- **Un seul développeur.**
- **Pas de nom de domaine** pour l'instant : le site utilise l'adresse fournie par Vercel.

## 7. Architecture technique

| Couche               | Choix                                             |
| -------------------- | ------------------------------------------------- |
| Interface            | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Validation           | Zod                                               |
| Base de données      | PostgreSQL via Supabase, RLS                      |
| Authentification     | Supabase Auth (session dans les cookies), TOTP    |
| Hébergement          | Vercel                                            |
| Tests                | Vitest (unitaires), Playwright (bout en bout)     |
| Intégration continue | GitHub Actions, Dependabot                        |

Le détail des tables est dans le [modèle de données](modele-de-donnees.md).

## 8. Hors périmètre

- Publication sur l'App Store ou le Play Store (la PWA suffit pour l'instant).
- Partage entre étudiants, groupes, rôle enseignant.
- Notes éliminatoires : règle à confirmer avant de l'ajouter au calcul.

## 9. Évolutions prévues (v1.1)

1. **Calendrier** : vue mois et semaine, couleurs des matières, ajout rapide.
2. **Statistiques** : temps de travail et évolution des moyennes.
3. **Planning de révisions.**
4. **Rappels d'échéances** par notification.

## 10. Avant une ouverture au public

- Compléter les informations de l'éditeur dans les mentions légales.
- Ajouter un CAPTCHA à l'inscription.
- Installer les modèles d'e-mail en français dans Supabase.
- Envisager un nom de domaine et un service d'envoi d'e-mails dédié.
