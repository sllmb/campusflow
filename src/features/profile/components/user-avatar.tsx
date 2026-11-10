import Link from "next/link";
import { getCurrentProfile } from "../queries";

function initialOf(name: string, email: string) {
  return (name || email || "?").trim().charAt(0).toUpperCase();
}

/** Pastille avec l'initiale de l'utilisateur, qui mène au profil. À placer sous un <Suspense>. */
export async function UserAvatar() {
  const { displayName, email } = await getCurrentProfile();
  return <AvatarLink initial={initialOf(displayName, email)} />;
}

export function AvatarLink({ initial }: { initial?: string }) {
  return (
    <Link
      href="/profil"
      aria-label="Mon profil"
      className="flex size-12 items-center justify-center rounded-full border-2 bg-surface text-lg font-extrabold shadow-hard-sm"
    >
      {initial ?? ""}
    </Link>
  );
}
