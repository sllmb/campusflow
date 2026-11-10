import type { AuthError } from "@supabase/supabase-js";

export function mfaErrorMessage(error: AuthError) {
  switch (error.code) {
    case "mfa_verification_failed":
    case "mfa_verification_rejected":
      return "Code incorrect ou expiré. Saisis le code affiché en ce moment dans ton application.";
    case "mfa_challenge_expired":
      return "Le délai est dépassé. Réessaie avec un nouveau code.";
    case "insufficient_aal":
      return "Reconnecte-toi avec ton code avant de modifier la double authentification.";
    case "over_request_rate_limit":
      return "Trop de tentatives. Réessaie dans quelques minutes.";
    default:
      return "Une erreur est survenue. Réessaie dans un instant.";
  }
}
