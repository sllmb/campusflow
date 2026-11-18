import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ResponseForm } from "@/features/forms/components/response-form";
import { getFormWithQuestions, hasAnswered } from "@/features/forms/queries";

export const metadata: Metadata = { title: "Questionnaire" };

async function Questionnaire({ params }: PageProps<"/questionnaires/[formId]">) {
  const { formId } = await params;
  if (!/^[0-9a-f-]{36}$/.test(formId)) notFound();
  // La RLS ne laisse lire qu'un formulaire ouvert : un brouillon ou un formulaire fermé = 404.
  const [data, answered] = await Promise.all([getFormWithQuestions(formId), hasAnswered(formId)]);
  if (!data || data.form.status !== "open") notFound();

  return (
    <>
      <PageHeader title={data.form.title} description={data.form.description || undefined} />
      {answered ? (
        <Card className="max-w-xl">
          <CardTitle>Tu as déjà répondu</CardTitle>
          <p className="mt-2 text-[15px] text-ink-soft">Merci ! Une seule réponse par personne.</p>
          <ButtonLink href="/dashboard" variant="dark" className="mt-4">
            Retour à l&apos;accueil
          </ButtonLink>
        </Card>
      ) : (
        <ResponseForm
          formId={data.form.id}
          questions={data.questions}
          anonymous={data.form.anonymous}
        />
      )}
    </>
  );
}

export default function QuestionnairePage(props: PageProps<"/questionnaires/[formId]">) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-card bg-muted" />}>
      <Questionnaire {...props} />
    </Suspense>
  );
}
