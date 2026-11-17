import { BookOpen, ClipboardList, GraduationCap, Timer } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "./section-heading";

type Feature = {
  icon: typeof BookOpen;
  iconBg: string;
  title: string;
  text: string;
  /** Petit exemple visuel de la fonctionnalité. */
  sample: ReactNode;
};

const features: Feature[] = [
  {
    icon: BookOpen,
    iconBg: "bg-blue",
    title: "Tes matières",
    text: "Chaque matière a sa couleur et son coefficient. Devoirs, examens et notes s'y rattachent.",
    sample: (
      <div className="flex flex-wrap gap-1.5">
        <Badge tone="blue">Maths · coef 4</Badge>
        <Badge tone="green">Physique · coef 3</Badge>
        <Badge tone="orange">Éco · coef 2</Badge>
      </div>
    ),
  },
  {
    icon: ClipboardList,
    iconBg: "bg-pink",
    title: "Tes échéances",
    text: "Devoirs, projets et examens triés par date. Ce qui est en retard saute aux yeux.",
    sample: (
      <div className="flex items-center justify-between rounded-xl border-2 bg-surface px-3 py-2">
        <span className="text-sm font-bold">Exposé d&apos;histoire</span>
        <Badge tone="pink">En retard</Badge>
      </div>
    ),
  },
  {
    icon: GraduationCap,
    iconBg: "bg-yellow",
    title: "Tes moyennes",
    text: "Saisis tes notes : la moyenne de chaque matière et la moyenne générale se calculent seules.",
    sample: (
      <p className="text-4xl font-extrabold tracking-[-0.04em]">
        13,4<span className="text-base font-bold">/20</span>
      </p>
    ),
  },
  {
    icon: Timer,
    iconBg: "bg-green",
    title: "Ton focus",
    text: "Pomodoro de 25 min ou deep work de 1 h à 10 h. Ton temps de travail est enregistré par matière.",
    sample: <p className="text-4xl font-extrabold tracking-[-0.04em] tabular-nums">25:00</p>,
  },
];

export function Features() {
  return (
    <section
      id="fonctionnalites"
      aria-labelledby="features-title"
      className="scroll-mt-24 py-16 lg:py-24"
    >
      <SectionHeading
        id="features-title"
        eyebrow="Fonctionnalités"
        title="Tout ce qu'il faut pour ton semestre"
        description="Quatre outils qui se parlent : une note ajoutée met à jour ta moyenne, un devoir ajouté apparaît dans tes échéances."
      />
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {features.map(({ icon: Icon, iconBg, title, text, sample }) => (
          <Card key={title} className="flex flex-col p-6">
            <span
              className={`flex size-12 items-center justify-center rounded-2xl border-2 ${iconBg}`}
            >
              <Icon className="size-6" strokeWidth={2.2} aria-hidden />
            </span>
            <h3 className="mt-4 text-xl font-extrabold tracking-tight">{title}</h3>
            <p className="mt-1 text-[15px] text-ink-soft">{text}</p>
            <div aria-hidden className="mt-5 border-t-2 border-dashed pt-4">
              {sample}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
