import { getCurrentProfile } from "../queries";

/** « Salut Awa ! » — à placer sous un <Suspense> avec « Salut ! » en attendant. */
export async function Greeting() {
  const { displayName } = await getCurrentProfile();
  const firstName = displayName.split(" ")[0];
  return <>{firstName ? `Salut ${firstName} !` : "Salut !"}</>;
}
