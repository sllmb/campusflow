# Sécurité

## Signaler une faille

Merci de **ne pas** ouvrir d'issue publique. Écris à l'adresse de contact indiquée dans les
[mentions légales](https://campusflow-two-chi.vercel.app/mentions-legales), avec les étapes pour
reproduire le problème. Une réponse est donnée sous 7 jours.

## Mesures en place

- **Données isolées par compte** : Row Level Security sur toutes les tables, droits explicites
  (aucun accès anonyme), clés étrangères composites `(id, user_id)` pour interdire tout
  rattachement à la ligne d'un autre compte, contraintes `CHECK` sur toutes les valeurs.
- **Double authentification** facultative ; politiques RLS restrictives : sans le code, un compte
  protégé ne lit ni n'écrit rien.
- **Aucune clé secrète** dans l'application : seule la clé publique Supabase est utilisée.
- **Entrées validées** côté serveur (Zod) avant toute écriture ; redirections limitées aux pages
  du site (`safeNext`).
- **En-têtes** : HSTS, CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` ;
  pages personnelles servies en `Cache-Control: private, no-store`.
- **Service worker** : aucune page ni donnée personnelle mise en cache.
- **Dépendances** surveillées par Dependabot ; lint, types, tests et build à chaque pull request.
