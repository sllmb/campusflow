/**
 * Clé publique VAPID : elle identifie CampusFlow auprès des services de notification (Apple,
 * Google, Mozilla). Publique par nature, elle est envoyée au navigateur. Sa clé privée, elle,
 * n'existe que dans les variables de Vercel (VAPID_PRIVATE_KEY).
 */
export const VAPID_PUBLIC_KEY =
  "BHzZGtay67uLEMOptSyjDgsfA7rbFxs69dVm5-iZoAcWklR7njb6obvgYlnj1NDoCaXhrE-GwSbNcNmXDboCyRk";

/** Contact donné aux services de notification en cas de problème. */
export const VAPID_SUBJECT = "https://campusflow-two-chi.vercel.app";
