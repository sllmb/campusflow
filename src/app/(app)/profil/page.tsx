import type { Metadata } from "next";
import { KeyRound, LogOut } from "lucide-react";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { DeleteAccountCard } from "@/features/account/components/delete-account-card";
import { signOut } from "@/features/auth/actions";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { getCurrentProfile } from "@/features/profile/queries";
import { RemindersCardLoader } from "@/features/reminders/components/reminders-card-loader";
import { TwoFactorCard } from "@/features/two-factor/components/two-factor-card";
import { getTwoFactorEnabled } from "@/features/two-factor/queries";

export const metadata: Metadata = { title: "Profil" };

async function ProfileDetails() {
  const profile = await getCurrentProfile();
  return (
    <>
      <p className="mt-1 text-[15px] text-ink-soft">
        Connecté avec <span className="font-bold text-ink">{profile.email}</span>
      </p>
      <div className="mt-5">
        <ProfileForm displayName={profile.displayName} />
      </div>
    </>
  );
}

async function TwoFactorSection() {
  return <TwoFactorCard enabled={await getTwoFactorEnabled()} />;
}

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Profil" description="Ton nom et ton compte." />
      <div className="grid max-w-xl gap-5">
        <Card>
          <CardTitle>Mes informations</CardTitle>
          <Suspense fallback={<p className="mt-2 text-[15px] text-ink-soft">Chargement…</p>}>
            <ProfileDetails />
          </Suspense>
        </Card>
        <RemindersCardLoader />
        <Suspense fallback={<div className="h-40 animate-pulse rounded-card bg-muted" />}>
          <TwoFactorSection />
        </Suspense>
        <Card>
          <CardTitle>Session</CardTitle>
          <p className="mt-1 mb-4 text-[15px] text-ink-soft">
            Tu devras te reconnecter pour accéder à tes données.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/nouveau-mot-de-passe" variant="outline">
              <KeyRound /> Modifier mon mot de passe
            </ButtonLink>
            <form action={signOut}>
              <Button type="submit" variant="outline">
                <LogOut /> Se déconnecter
              </Button>
            </form>
          </div>
        </Card>
        <DeleteAccountCard />
      </div>
    </>
  );
}
