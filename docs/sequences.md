# Diagrammes de séquence

Qui parle à qui, et dans quel ordre, pour les parcours les plus importants. Les participants :

- **Navigateur** : le téléphone ou l'ordinateur de l'étudiant.
- **Proxy** : `src/proxy.ts`, exécuté avant chaque page.
- **Serveur** : les pages et les Server Actions de Next.js, hébergées sur Vercel.
- **Supabase Auth** et **Base** : les comptes et la base PostgreSQL.

## Ajouter une note

```mermaid
sequenceDiagram
    autonumber
    actor E as Étudiant
    participant N as Navigateur
    participant S as Serveur (saveGrade)
    participant B as Base (Supabase)

    E->>N: Remplit le formulaire et touche « Ajouter »
    N->>S: Envoie le formulaire (Server Action)
    S->>S: Vérifie les champs avec Zod
    alt Champs invalides
        S-->>N: Erreurs par champ
        N-->>E: Message sous le champ
    else Champs valides
        S->>B: insert into grades (session lue dans le cookie)
        B->>B: RLS : user_id = auth.uid() ?<br/>Clé (subject_id, user_id) : la matière est-elle à lui ?
        alt Refusé
            B-->>S: Erreur
            S-->>N: « Impossible d'enregistrer »
        else Accepté
            B-->>S: OK
            S->>S: revalidatePath("/notes", "/dashboard")
            S-->>N: Page recalculée (moyennes à jour)
            N-->>E: Nouvelle moyenne affichée
        end
    end
```

Fichiers : `src/features/grades/components/grade-form.tsx`, `src/features/grades/actions.ts`,
`src/features/grades/lib/average.ts`.

## Se connecter avec la double authentification

```mermaid
sequenceDiagram
    autonumber
    actor E as Étudiant
    participant N as Navigateur
    participant P as Proxy
    participant S as Serveur
    participant A as Supabase Auth

    E->>N: E-mail et mot de passe
    N->>S: signIn (Server Action)
    S->>A: signInWithPassword
    A-->>S: Session de niveau « aal1 » (mot de passe seul)
    S->>A: Niveau exigé pour ce compte ?
    A-->>S: « aal2 » (2FA activée)
    S-->>N: Redirection vers /verification + cookie de session

    Note over N,P: Tant que le code n'est pas saisi, le proxy renvoie<br/>toute page privée vers /verification, et la base refuse toute lecture.

    E->>N: Code à 6 chiffres
    N->>S: verifyTwoFactorLogin
    S->>A: challengeAndVerify(code)
    alt Code faux ou expiré
        A-->>S: Erreur
        S-->>N: « Code incorrect ou expiré »
    else Code correct
        A-->>S: Session de niveau « aal2 »
        S-->>N: Redirection vers la page demandée (safeNext)
        N->>P: GET /dashboard
        P->>A: Niveau de la session ?
        A-->>P: aal2
        P-->>N: Page autorisée, Cache-Control: private, no-store
    end
```

Fichiers : `src/features/auth/actions.ts`, `src/features/two-factor/actions.ts`,
`src/lib/supabase/proxy.ts`, `supabase/migrations/20261113090000_enforce_mfa.sql`.

## Rappel du matin

```mermaid
sequenceDiagram
    autonumber
    participant C as Vercel Cron
    participant S as Serveur (/api/rappels)
    participant B as Base (clé secrète)
    participant P as Service de notification
    participant T as Téléphone

    C->>S: GET chaque jour à 7 h UTC, avec CRON_SECRET
    alt Secret absent ou faux
        S-->>C: 401, rien n'est lu
    else Secret correct
        S->>B: Abonnements (tous les comptes)
        loop Pour chaque étudiant pas encore prévenu aujourd'hui
            S->>B: Échéances proches et révisions du jour
            S->>S: buildDigest : rien à dire ? alors pas de message
            S->>P: Notification chiffrée et signée (VAPID)
            P->>T: Affichée, même app fermée
            alt Abonnement expiré (404 ou 410)
                S->>B: Supprime l'abonnement
            else Envoyé
                S->>B: last_sent_on = aujourd'hui
            end
        end
    end
```

Fichiers : `vercel.json`, `src/app/api/rappels/route.ts`, `src/features/reminders/`,
`public/sw.js` (affichage et ouverture de la notification).

## Confirmer son inscription

```mermaid
sequenceDiagram
    autonumber
    actor V as Visiteur
    participant N as Navigateur
    participant S as Serveur
    participant A as Supabase Auth
    participant M as Gmail (SMTP)

    V->>N: Prénom, e-mail, mot de passe
    N->>S: signUp (Server Action)
    S->>A: signUp + adresse de retour /auth/confirm
    A->>M: E-mail de confirmation
    M-->>V: Lien « Confirmer mon adresse »
    S-->>N: « Ouvre le mail envoyé à … »
    V->>N: Clique sur le lien
    N->>S: GET /auth/confirm?token_hash=…
    S->>A: verifyOtp(token_hash)
    A-->>S: Session ouverte
    S-->>N: Redirection vers /dashboard
```

Fichiers : `src/features/auth/actions.ts`, `src/app/auth/confirm/route.ts`,
`supabase/templates/confirm-signup.html`.
