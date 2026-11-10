import { Database, EyeOff, KeyRound } from "lucide-react";
import { SectionHeading } from "./section-heading";

const points = [
  {
    icon: EyeOff,
    title: "Privé par défaut",
    text: "Tes notes, tes devoirs et ton emploi du temps ne sont visibles que par toi.",
  },
  {
    icon: Database,
    title: "Protégé jusque dans la base",
    text: "Chaque donnée est rattachée à ton compte, et la base de données refuse tout accès depuis un autre compte.",
  },
  {
    icon: KeyRound,
    title: "Connexion sécurisée",
    text: "Ton mot de passe n'est jamais stocké en clair, et ta session est chiffrée.",
  },
];

export function Privacy() {
  return (
    <section aria-labelledby="privacy-title" className="py-6 lg:py-10">
      <div className="rounded-card border-2 bg-ink p-7 text-background shadow-hard lg:p-12">
        <SectionHeading
          id="privacy-title"
          eyebrow="Confidentialité"
          eyebrowTone="yellow"
          title={
            <>
              Tes données restent <span className="text-primary">à toi.</span>
            </>
          }
          description="Tes notes ne regardent que toi. CampusFlow est construit autour de cette règle."
        />
        <ul className="mt-10 grid gap-6 lg:grid-cols-3">
          {points.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span className="flex size-12 items-center justify-center rounded-2xl border-2 border-background text-primary">
                <Icon className="size-6" strokeWidth={2.2} aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-extrabold">{title}</h3>
              <p className="mt-1 text-[15px] opacity-80">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
