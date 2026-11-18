"use client";

import { ClipboardCheck } from "lucide-react";
import { useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

const HIDDEN_KEY = "campusflow:questionnaires-masques";

function loadHidden(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(HIDDEN_KEY) ?? "[]");
  } catch {
    return [];
  }
}

/**
 * « Un questionnaire t'attend » sur l'accueil. Toujours facultatif : « Plus tard » le masque
 * sur cet appareil (rendu côté navigateur seulement, voir PendingFormsLoader).
 */
export function PendingFormsCard({ forms }: { forms: { id: string; title: string }[] }) {
  const [hidden, setHidden] = useState(loadHidden);
  const visible = forms.filter((form) => !hidden.includes(form.id));
  if (visible.length === 0) return null;
  const form = visible[0];

  const later = () => {
    const next = [...hidden, form.id];
    setHidden(next);
    try {
      window.localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
    } catch {
      // Stockage indisponible : la carte reviendra à la prochaine visite.
    }
  };

  return (
    <Card tone="orange" className="col-span-2 lg:col-span-4">
      <div className="flex items-start gap-3">
        <ClipboardCheck className="mt-0.5 size-6 shrink-0" strokeWidth={2.4} aria-hidden />
        <div className="min-w-0 flex-1">
          <CardTitle>Un questionnaire t&apos;attend</CardTitle>
          <p className="mt-1 text-[15px] font-semibold">{form.title}</p>
          <p className="mt-1 text-[13px]">Quelques questions pour améliorer CampusFlow.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ButtonLink href={`/questionnaires/${form.id}`} variant="dark" size="sm">
              Répondre
            </ButtonLink>
            <button
              type="button"
              onClick={later}
              className="h-9 cursor-pointer rounded-full px-4 text-sm font-bold hover:bg-ink/10"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
