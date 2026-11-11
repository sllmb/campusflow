# Journal des versions

Toutes les évolutions notables de CampusFlow. Format inspiré de
[Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), numérotation
[SemVer](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté

- **Calendrier des échéances** (Devoirs → Calendrier) : vue mois et vue semaine, couleurs des
  matières, ajout rapide d'une échéance sur un jour choisi. Les jours suivent le fuseau horaire
  de l'étudiant.

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

[1.0.0]: https://github.com/sllmb/campusflow/releases/tag/v1.0.0
[0.1.0]: https://github.com/sllmb/campusflow/releases/tag/v0.1.0
