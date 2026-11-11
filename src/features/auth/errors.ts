import type { AuthError } from "@supabase/supabase-js";

/** Traduit les erreurs d'authentification Supabase en messages compréhensibles. */
export function authErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "E-mail ou mot de passe incorrect.";
    case "email_not_confirmed":
      return "Confirme d'abord ton adresse e-mail grâce au lien reçu par mail.";
    case "user_already_exists":
    case "email_exists":
      return "Un compte existe déjà avec cette adresse. Connecte-toi.";
    case "weak_password":
      return "Mot de passe trop faible : choisis-en un plus long ou plus varié.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Trop de tentatives. Réessaie dans quelques minutes.";
    case "signup_disabled":
      return "Les inscriptions sont fermées pour le moment.";
    case "same_password":
      return "Choisis un mot de passe différent de l'ancien.";
    case "insufficient_aal":
      return "Saisis d'abord ton code de double authentification.";
    case "reauthentication_needed":
    case "session_expired":
    case "session_not_found":
      return "Le lien a expiré. Redemande un e-mail de réinitialisation.";
    case "email_address_invalid":
      return "Cette adresse e-mail n'est pas acceptée. Vérifie-la ou utilises-en une autre.";
    case "email_address_not_authorized":
      // Service d'e-mails par défaut de Supabase : il n'écrit qu'aux membres du projet.
      return "Impossible d'envoyer l'e-mail de confirmation pour le moment. Réessaie plus tard.";
    default:
      return "Une erreur est survenue. Réessaie dans un instant.";
  }
}

/**
 * Journalise une erreur d'authentification côté serveur (visible dans les logs de Vercel),
 * sans données personnelles : seulement l'opération, le code, le statut et le message.
 */
export function logAuthError(
  operation: "signIn" | "signUp" | "resetRequest" | "updatePassword",
  error: AuthError,
) {
  console.error(
    `[auth] ${operation} a échoué`,
    JSON.stringify({
      code: error.code ?? null,
      status: error.status ?? null,
      message: error.message,
    }),
  );
}
