import type { Metadata } from "next";
import { ArrowLeft, ChartColumn, Lock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { AdminGate } from "@/features/admin/components/admin-gate";
import { deleteForm, setFormStatus } from "@/features/forms/actions";
import {
  DeleteForm,
  FormSettings,
  NewQuestionPanel,
  QuestionItem,
} from "@/features/forms/components/admin-forms";
import { canPublish, FORM_STATUSES } from "@/features/forms/lib/forms";
import { getFormWithQuestions } from "@/features/forms/queries";
import { plural } from "@/lib/format";

export const metadata: Metadata = { title: "Formulaire", robots: { index: false } };

function StatusButton({
  formId,
  status,
  label,
  variant = "outline",
  disabled,
}: {
  formId: string;
  status: "draft" | "open" | "closed";
  label: string;
  variant?: "outline" | "dark";
  disabled?: boolean;
}) {
  return (
    <form action={setFormStatus}>
      <input type="hidden" name="id" value={formId} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" variant={variant} size="sm" disabled={disabled}>
        {label}
      </Button>
    </form>
  );
}

async function FormEditor({ params }: PageProps<"/admin/formulaires/[formId]">) {
  const { formId } = await params;
  const data = /^[0-9a-f-]{36}$/.test(formId) ? await getFormWithQuestions(formId) : null;
  if (!data) notFound();
  const { form, questions, responses } = data;
  const locked = responses > 0;
  const status = FORM_STATUSES[form.status];

  return (
    <>
      <Link
        href="/admin/formulaires"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold hover:underline"
      >
        <ArrowLeft className="size-4" strokeWidth={2.6} aria-hidden /> Formulaires
      </Link>
      <PageHeader
        title={form.title}
        description={plural(responses, "réponse")}
        action={
          <ButtonLink href={`/admin/formulaires/${form.id}/resultats`} variant="dark" size="sm">
            <ChartColumn /> Résultats
          </ButtonLink>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem] lg:items-start">
        <section aria-labelledby="questions-title" className="grid gap-3">
          <h2 id="questions-title" className="text-lg font-extrabold tracking-tight">
            Questions
          </h2>
          {locked && (
            <p className="flex items-center gap-2 rounded-2xl border-2 border-dashed p-3 text-sm font-semibold">
              <Lock className="size-4 shrink-0" strokeWidth={2.4} aria-hidden />
              Des étudiants ont répondu : les questions ne peuvent plus changer.
            </p>
          )}
          {questions.length === 0 ? (
            <p className="text-[15px] text-ink-soft">
              Aucune question. Ajoute-en au moins une pour pouvoir publier.
            </p>
          ) : (
            <ol className="grid gap-3">
              {questions.map((question, index) => (
                <QuestionItem
                  key={question.id}
                  formId={form.id}
                  question={question}
                  index={index}
                  total={questions.length}
                  locked={locked}
                />
              ))}
            </ol>
          )}
          {!locked && <NewQuestionPanel formId={form.id} />}
        </section>

        <div className="grid gap-5">
          <Card>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Publication</CardTitle>
              <Badge tone={status.tone}>{status.label}</Badge>
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              {form.status === "draft" &&
                "Invisible pour les étudiants. Publie-le quand les questions sont prêtes."}
              {form.status === "open" &&
                "Les étudiants le voient sur leur accueil et peuvent répondre une fois."}
              {form.status === "closed" && "Les réponses sont fermées. Tu peux le rouvrir."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {form.status === "draft" && (
                <StatusButton
                  formId={form.id}
                  status="open"
                  label="Publier"
                  variant="dark"
                  disabled={!canPublish(questions)}
                />
              )}
              {form.status === "open" && (
                <StatusButton formId={form.id} status="closed" label="Fermer les réponses" />
              )}
              {form.status === "closed" && (
                <StatusButton formId={form.id} status="open" label="Rouvrir" variant="dark" />
              )}
            </div>
          </Card>

          <Card>
            <CardTitle>Réglages</CardTitle>
            <div className="mt-3">
              <FormSettings form={form} locked={locked} />
            </div>
          </Card>

          <div>
            <DeleteForm
              action={deleteForm}
              id={form.id}
              label="Supprimer le formulaire"
              message={`Supprimer « ${form.title} » et toutes ses réponses ? C'est irréversible.`}
              withText
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default function FormEditorPage(props: PageProps<"/admin/formulaires/[formId]">) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-card bg-muted" />}>
      <AdminGate>
        <FormEditor {...props} />
      </AdminGate>
    </Suspense>
  );
}
