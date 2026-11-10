"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const COOKIE = "tz";

/**
 * Enregistre le fuseau horaire du navigateur dans un cookie, pour que le serveur
 * affiche les échéances à la bonne heure. Recharge les données une fois s'il a changé.
 */
export function TimeZoneSync() {
  const router = useRouter();

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timeZone) return;
    const current = document.cookie
      .split("; ")
      .find((part) => part.startsWith(`${COOKIE}=`))
      ?.slice(COOKIE.length + 1);
    if (current && decodeURIComponent(current) === timeZone) return;
    document.cookie = `${COOKIE}=${encodeURIComponent(timeZone)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [router]);

  return null;
}
