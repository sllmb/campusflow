import { Plus } from "lucide-react";
import { SectionHeading } from "./section-heading";

const questions = [
  {
    q: "CampusFlow, c'est pour qui ?",
    a: "Pour les étudiants qui veulent suivre au même endroit leurs matières, leurs devoirs, leurs examens et leurs notes, du lycée aux études supérieures.",
  },
  {
    q: "Qui peut voir mes notes ?",
    a: "Toi seul. Chaque donnée est liée à ton compte, et la base de données bloque l'accès depuis tout autre compte, même en cas d'erreur dans l'application.",
  },
  {
    q: "Est-ce que ça marche sur téléphone ?",
    a: "Oui, l'application est pensée d'abord pour le téléphone. Elle s'ouvre dans ton navigateur : rien à installer. Elle fonctionne aussi sur ordinateur.",
  },
  {
    q: "Comment sont calculées les moyennes ?",
    a: "À partir de tes notes et des coefficients que tu indiques pour chaque matière. La moyenne de chaque matière et la moyenne générale se mettent à jour dès que tu ajoutes une note.",
  },
  {
    q: "Il y a un calendrier ou des rappels ?",
    a: "Pas encore. Le calendrier, les statistiques et un planning de révision sont prévus pour une prochaine version.",
  },
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-24 py-16 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <SectionHeading
          id="faq-title"
          eyebrow="FAQ"
          title="Questions fréquentes"
          description="Une autre question ? Crée ton compte et découvre l'app par toi-même."
        />
        <div className="grid gap-3">
          {questions.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-3xl border-2 bg-surface shadow-hard-sm open:shadow-hard"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[17px] font-extrabold [&::-webkit-details-marker]:hidden">
                {q}
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 bg-primary transition-transform group-open:rotate-45"
                >
                  <Plus className="size-4" strokeWidth={2.6} />
                </span>
              </summary>
              <p className="px-5 pb-5 text-[15px] text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
