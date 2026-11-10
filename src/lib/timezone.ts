import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_TIME_ZONE, isValidTimeZone } from "./time";

/** Nom du cookie où le navigateur enregistre son fuseau (voir TimeZoneSync). */
export const TIME_ZONE_COOKIE = "tz";

/** Fuseau horaire de l'utilisateur, lu dans le cookie posé par son navigateur. */
export async function getTimeZone() {
  const value = (await cookies()).get(TIME_ZONE_COOKIE)?.value;
  const timeZone = value ? decodeURIComponent(value) : "";
  return timeZone && isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIME_ZONE;
}
