import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="pb-16 lg:pb-24">
      <div className="flex flex-col items-start gap-6 rounded-card border-2 bg-primary p-7 shadow-hard lg:flex-row lg:items-center lg:justify-between lg:p-12">
        <div>
          <h2
            id="cta-title"
            className="text-[34px] leading-[1.02] font-extrabold tracking-[-0.035em] lg:text-5xl"
          >
            Prêt pour ce semestre ?
          </h2>
          <p className="mt-2 text-[17px] font-semibold">Ton compte est prêt en une minute.</p>
        </div>
        <ButtonLink href="/signup" variant="dark" size="lg">
          Créer mon compte <ArrowRight />
        </ButtonLink>
      </div>
    </section>
  );
}
