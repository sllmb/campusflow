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
    default:
      return "Une erreur est survenue. Réessaie dans un instant.";
  }
}
