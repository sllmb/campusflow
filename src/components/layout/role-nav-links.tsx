import { getAdminAccess } from "@/features/admin/queries";
import { NavLinks } from "./nav-links";

/** Choisit le menu (étudiant ou admin) côté serveur, d'après la session. */
export async function RoleNavLinks({ variant }: { variant: "sidebar" | "bottom" }) {
  const admin = (await getAdminAccess()) !== "denied";
  return <NavLinks variant={variant} admin={admin} />;
}
