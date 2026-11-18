import type { Metadata } from "next";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AdminGate } from "@/features/admin/components/admin-gate";
import { FORM_STATUSES, QUESTION_KINDS } from "@/features/forms/lib/forms";
import { summarize, type OptionCount, type QuestionSummary } from "@/features/forms/lib/results";
import { getFormResults } from "@/features/forms/queries";
import { formatNumber, plural } from "@/lib/format";

export const metadata: Metadata = { title: "Résultats", robots: { index: false } };

const TEXTS_SHOWN = 20;

/** Barres horizontales, avec effectif et part en clair (lisibles sans le dessin). */
function Bars({ counts, unit }: { counts: OptionCount[]; unit: string }) {
  return (
    <ul className="grid gap-3">
      {counts.map(({ option, count, share }) => (
        <li key={option}>
          <div className="flex items-baseline justify-between gap-3 text-[15px]">
            <span className="min-w-0 font-bold break-words">{option}</span>
            <span className="shrink-0 font-semibold tabular-nums">
              {plural(count, unit)}
              <span className="ml-1.5 text-[13px] text-ink-soft">{Math.round(share * 100)} %</span>
            </span>
          </div>
          <div aria-hidden className="mt-1.5 h-3 rounded-full border-2 bg-muted">
            <div
              className="-m-0.5 h-3 rounded-full border-2 bg-primary"
              style={{ width: share > 0 ? `calc(${share * 100}% + 4px)` : 0 }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function QuestionResult({ summary, index }: { summary: QuestionSummary; index: number }) {
  const kind = QUESTION_KINDS.find((k) => k.value === summary.question.kind)!;
  return (
    <Card className="grid gap-4 p-5">
      <div>
        <h2 className="text-[15px] font-extrabold">
          {index + 1}. {summary.question.label}
        </h2>
        <p className="mt-1 text-[13px] text-ink-soft">
          {kind.label} · {plural(summary.answered, "réponse")}
        </p>
      </div>

      {summary.answered === 0 ? (
        <p className="text-[15px] text-ink-soft">Pas encore de réponse.</p>
      ) : summary.kind === "choice" ? (
        <Bars counts={summary.counts} unit="personne" />
      ) : summary.kind === "scale" ? (
        <>
          <p className="text-[15px] font-semibold">
            Moyenne :{" "}
            <span className="text-3xl font-extrabold tabular-nums">
              {formatNumber(summary.average ?? 0)}
            </span>{" "}
            / 5
          </p>
          <Bars counts={summary.counts} unit="personne" />
        </>
      ) : (
        <ul className="grid gap-2">
          {summary.texts.slice(0, TEXTS_SHOWN).map((text, i) => (
            <li key={i} className="rounded-2xl border-2 bg-background px-4 py-3 text-[15px]">
              <p className="break-words whitespace-pre-line">{text.text}</p>
              {text.by && <p className="mt-1 text-[13px] text-ink-soft">— {text.by}</p>}
            </li>
          ))}
          {summary.texts.length > TEXTS_SHOWN && (
            <li className="text-[13px] text-ink-soft">
              Et {plural(summary.texts.length - TEXTS_SHOWN, "autre réponse", "autres réponses")} :
              toutes sont dans l&apos;export CSV.
            </li>
          )}
        </ul>
      )}
    </Card>
  );
}

async function Results({ params }: PageProps<"/admin/formulaires/[formId]/resultats">) {
  const { formId } = await params;
  const data = /^[0-9a-f-]{36}$/.test(formId) ? await getFormResults(formId) : null;
  if (!data) notFound();
  const { form, questions, responses } = data;
  const summaries = summarize(questions, responses);
  const status = FORM_STATUSES[form.status];

  return (
    <>
      <Link
        href={`/admin/formulaires/${form.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold hover:underline"
      >
        <ArrowLeft className="size-4" strokeWidth={2.6} aria-hidden /> Retour au formulaire
      </Link>
      <PageHeader
        eyebrow="Résultats"
        title={form.title}
        description={plural(responses.length, "réponse")}
      />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Badge tone={status.tone}>{status.label}</Badge>
        <Badge>{form.anonymous ? "Anonyme" : "Nominatif"}</Badge>
        {responses.length > 0 && (
          <a
            href={`/admin/formulaires/${form.id}/export`}
            download
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full border-2 bg-surface px-4 text-sm font-bold shadow-hard-sm"
          >
            <Download className="size-4" strokeWidth={2.4} aria-hidden /> Exporter en CSV
          </a>
        )}
      </div>
      <div className="grid max-w-3xl gap-4">
        {summaries.map((summary, index) => (
          <QuestionResult key={summary.question.id} summary={summary} index={index} />
        ))}
      </div>
    </>
  );
}

export default function ResultsPage(props: PageProps<"/admin/formulaires/[formId]/resultats">) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-card bg-muted" />}>
      <AdminGate>
        <Results {...props} />
      </AdminGate>
    </Suspense>
  );
}
