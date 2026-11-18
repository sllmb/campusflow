# Journal des versions

Toutes les évolutions notables de CampusFlow. Format inspiré de
[Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), numérotation
[SemVer](https://semver.org/lang/fr/).

## [1.3.0] — 18 novembre 2026

L'éditeur a ses outils : un espace admin séparé, la gestion des comptes et des questionnaires
pour mieux connaître les étudiants. Et CampusFlow est plus rapide.

### Ajouté

- **Espace admin**, réservé à l'éditeur avec la double authentification, séparé des pages
  d'étudiant (le compte admin n'a que Tableau, Utilisateurs, Formulaires et Profil) :
  - **Tableau** : l'adoption en chiffres globaux (étudiants, actifs sur 7 jours, inscriptions
    par jour, abonnés aux rappels, totaux de contenus) et nettoyage des comptes jamais confirmés ;
  - **Utilisateurs** : la liste des comptes (e-mail, prénom, dates, état), recherche, filtres,
    suspension, réactivation et suppression. Jamais le contenu des comptes.
- **Questionnaires** : l'admin crée des formulaires (réponse courte, paragraphe, choix unique,
  cases à cocher, échelle de 1 à 5), anonymes par défaut ou nominatifs. Les étudiants les voient
  sur leur accueil et y répondent une fois, toujours facultativement. Résultats en graphiques et
  export CSV pour Excel ou Google Sheets.

### Modifié

- **CampusFlow est plus rapide** : le serveur tourne à Dublin, à côté de la base de données, et
  les notes sont lues en un seul aller-retour au lieu de quatre.
- La politique de confidentialité décrit ce que l'éditeur voit (liste des comptes, chiffres
  globaux, réponses aux questionnaires) et ce qu'il ne voit jamais (le contenu des comptes).

### Sécurité

- Accès admin : rôle posé côté serveur (`app_metadata`) **et** code 2FA. Les autres reçoivent une
  404 avant même que la page commence à s'afficher.
- Formulaires protégés par la RLS (`private.is_admin()`), sans clé secrète ; anonymat réel (aucun
  lien entre une réponse anonyme et un compte).
- Export CSV : formules de tableur neutralisées.

### Base de données

Une migration : `20261119090000_create_forms`.

## [1.2.0] — 17 novembre 2026

Prête à accueillir d'autres étudiants : anti-robots, pages légales complètes et une base de test
séparée de la production.

### Ajouté

- **Anti-robots Cloudflare Turnstile** sur l'inscription, la connexion et le mot de passe
  oublié. Le jeton est vérifié par Supabase lui-même : impossible de contourner l'app. Si la
  vérification est bloquée (bloqueur de publicités, réseau), un message dit quoi faire.

### Modifié

- **Pages légales complètes** : éditeur, contact (campusflow.contact@gmail.com), hébergement des
  données dans l'Union européenne, droits selon la loi sénégalaise n° 2008-12 et recours auprès
  de la CDP. La politique de confidentialité couvre les révisions et les rappels.
- Après une inscription ou une demande de mot de passe, l'app rappelle de regarder dans les
  spams.
- Page d'accueil : la carte « Ton focus » mentionne le deep work de 1 h à 10 h.

### Corrigé

- Profil : le navigateur ne remplace plus le prénom enregistré par celui qu'il a mémorisé.

### Technique

- **Projet Supabase de test** pour le développement local et les tests de bout en bout : les
  essais ne touchent plus jamais les vraies données.
- Fins de ligne identiques sur tous les systèmes (`.gitattributes`), Windows compris.
- Dependabot écarte les mises à jour majeures testées et incompatibles (TypeScript 7,
  web-push 4, types de Node 26).

### Mise en place

Aucune migration. Variable Vercel `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, puis anti-robots activé dans
Supabase (production) avec la clé secrète Turnstile.

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

[1.3.0]: https://github.com/sllmb/campusflow/releases/tag/v1.3.0
[1.2.0]: https://github.com/sllmb/campusflow/releases/tag/v1.2.0
[1.1.0]: https://github.com/sllmb/campusflow/releases/tag/v1.1.0
[1.0.0]: https://github.com/sllmb/campusflow/releases/tag/v1.0.0
[0.1.0]: https://github.com/sllmb/campusflow/releases/tag/v0.1.0
