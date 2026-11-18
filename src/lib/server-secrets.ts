import "server-only";

/**
 * Une clé ne contient jamais d'espace ni de retour à la ligne : on retire ceux qu'un copier-coller
 * a pu glisser (au début, à la fin ou au milieu). Vide → undefined.
 */
function secret(value: string | undefined) {
  const cleaned = value?.replace(/\s+/g, "");
  return cleaned || undefined;
}

/** Variables secrètes du serveur ; undefined si elles ne sont pas (encore) configurées. */
export function getServerSecrets() {
  return {
    vapidPrivateKey: secret(process.env.VAPID_PRIVATE_KEY),
    supabaseSecretKey: secret(process.env.SUPABASE_SECRET_KEY),
    cronSecret: secret(process.env.CRON_SECRET),
  };
}
