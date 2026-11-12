# Journal des versions

Toutes les évolutions notables de CampusFlow. Format inspiré de
[Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), numérotation
[SemVer](https://semver.org/lang/fr/).

## [1.1.0] — 12 novembre 2026

Organiser ses révisions et ne plus rien oublier : calendrier, planning de révisions, rappels du
matin et statistiques.

### Ajouté

- **Calendrier des échéances** (Devoirs → Calendrier) : vue mois et vue semaine, couleurs des
  matières, ajout rapide d'une échéance sur un jour choisi. Les jours suivent le fuseau horaire
  de l'étudiant.
- **Planning de révisions** pour les examens et les projets : un temps total et des jours
  choisis, répartis jusqu'à la veille de l'échéance. Les créneaux apparaissent dans Devoirs, le
  calendrier et l'accueil (révisions du jour) ; « Lancer » ouvre le minuteur réglé.
- **Rappels du matin** (Profil → Rappels du matin) : une notification vers 8 h (heure du
  Sénégal) avec les échéances et révisions du jour, les examens du lendemain et les retards.
  Notification d'essai. Sur iPhone, dans l'app installée.
- **Statistiques** (depuis l'accueil, ou le menu sur ordinateur) : temps de concentration par
  jour sur 7 ou 30 jours comparé à la période d'avant, répartition par matière, série de jours
  d'affilée, évolution de la moyenne du semestre, devoirs rendus à temps.
- **Deep work de durée libre** : de 1 h à 10 h, par quarts d'heure, avec des raccourcis
  (1 h, 1 h 30, 2 h, 3 h, 4 h, 6 h, 10 h). La dernière durée choisie est proposée à nouveau.
- **Documentation du projet** (`docs/`) : cahier des charges, modèle de données (MCD, MLD),
  cas d'utilisation et diagrammes de séquence.

### Modifié

- Fuseau horaire par défaut : Sénégal (`Africa/Dakar`) au lieu de Paris.

### Sécurité

- Le rappel du matin est la seule partie de l'app qui utilise la clé secrète Supabase, côté
  serveur, derrière le secret de Vercel Cron (comparaison à temps constant).
- Les clés secrètes sont nettoyées des espaces et retours à la ligne collés par erreur, et les
  messages d'erreur bruts ne sont plus jamais renvoyés ni journalisés.

### Base de données

Trois migrations, à appliquer dans l'ordre : `20261115090000_longer_deep_work`,
`20261116090000_create_revision_sessions`, `20261117090000_create_push_subscriptions`.

## [1.0.0] — 11 novembre 2026

Première version complète : l'app est installable, protégée par la double authentification
et prête à être ouverte à d'autres étudiants.

### Ajouté

- **Page d'accueil publique** : navbar (menu mobile), présentation, fonctionnalités,
  « Comment ça marche », confidentialité, FAQ, footer.
- **Pages légales** : mentions légales et confidentialité (informations de l'éditeur à compléter).
- **Logo CampusFlow** : pictogramme, logo clair et sombre, icônes du site et de l'app.
- **Double authentification (2FA)** par application d'authentification, facultative ; la base de
  données refuse l'accès aux données tant que le code n'est pas saisi.
- **Application installable (PWA)** : plein écran depuis l'écran d'accueil, raccourcis, page
  hors connexion ; aucune donnée personnelle mise en cache.
- **Mot de passe oublié** et modification du mot de passe depuis le profil.
- Modèles d'e-mail en français (confirmation d'inscription, réinitialisation).

### Corrigé

- Inscription impossible en production quand l'adresse Supabase se terminait par `/rest/v1/`.
- Erreurs d'authentification traduites et journalisées.

### Sécurité

- Redirections après connexion limitées aux pages de CampusFlow (`safeNext`).
- En-têtes de sécurité (`nosniff`, `X-Frame-Options`, `Referrer-Policy`).

## [0.1.0] — 10 novembre 2026

Première version (MVP), utilisable pendant un semestre.

### Ajouté

- **Comptes** : inscription avec confirmation par e-mail, connexion, profil.
- **Semestres, UE et matières** : crédits ECTS, coefficients, couleurs.
- **Devoirs, projets et examens** : échéances dans le fuseau de l'utilisateur, statut, priorité.
- **Notes et moyennes** : modèle LMD, compensation dans l'UE et entre UE, décision du jury,
  crédits ECTS acquis.
- **Tableau de bord** : prochain rendu, moyenne, temps de concentration, à venir, matières.
- **Pomodoro et deep work** (2 h, 4 h), sessions enregistrées par matière.
- Sécurité par RLS sur toutes les tables, tests unitaires et de bout en bout, intégration
  continue GitHub Actions, mise en ligne sur Vercel.

[1.1.0]: https://github.com/sllmb/campusflow/releases/tag/v1.1.0
[1.0.0]: https://github.com/sllmb/campusflow/releases/tag/v1.0.0
[0.1.0]: https://github.com/sllmb/campusflow/releases/tag/v0.1.0
