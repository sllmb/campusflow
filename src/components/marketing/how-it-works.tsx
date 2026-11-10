import { SectionHeading } from "./section-heading";

const steps = [
  {
    number: "1",
    tone: "bg-yellow",
    title: "Crée ton compte",
    text: "Ton prénom, ton e-mail, un mot de passe. C'est prêt en une minute.",
  },
  {
    number: "2",
    tone: "bg-blue",
    title: "Ajoute tes matières",
    text: "Donne à chacune une couleur et un coefficient. Elles organisent tout le reste.",
  },
  {
    number: "3",
    tone: "bg-green",
    title: "Suis ta semaine",
    text: "Note tes devoirs et tes résultats au fil de l'eau. L'accueil te montre l'essentiel.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="comment-ca-marche"
      aria-labelledby="how-title"
      className="scroll-mt-24 py-16 lg:py-24"
    >
      <SectionHeading
        id="how-title"
        eyebrow="Comment ça marche"
        title="Trois étapes, et c'est parti"
      />
      <ol className="mt-10 grid gap-5 lg:grid-cols-3">
        {steps.map((step) => (
          <li
            key={step.number}
            className="relative rounded-card border-2 bg-surface p-6 pt-8 shadow-hard"
          >
            <span
              aria-hidden
              className={`flex size-14 items-center justify-center rounded-full border-2 text-2xl font-extrabold shadow-hard-sm ${step.tone}`}
            >
              {step.number}
            </span>
            <h3 className="mt-5 text-xl font-extrabold tracking-tight">
              <span className="sr-only">Étape {step.number} : </span>
              {step.title}
            </h3>
            <p className="mt-1 text-[15px] text-ink-soft">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
