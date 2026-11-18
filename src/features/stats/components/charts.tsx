import { formatAverage } from "@/features/grades/format";
import { PASSING_GRADE } from "@/features/grades/lib/average";
import { formatDate, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

const weekday = new Intl.DateTimeFormat("fr-FR", { weekday: "narrow", timeZone: "UTC" });
const longDay = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const utc = (date: string) => new Date(`${date}T00:00:00Z`);

/** Barres du temps de concentration par jour (échelle d'au moins 1 h). */
export function FocusBars(props: {
  days: { date: string; seconds: number }[];
  today: string;
  caption: string;
}) {
  return (
    <DayBars
      {...props}
      days={props.days.map(({ date, seconds }) => ({ date, value: seconds }))}
      format={formatDuration}
      floor={3600}
    />
  );
}

/**
 * Une barre par jour. Dessinées en HTML (pas de bibliothèque) ; le tableau caché donne les mêmes
 * chiffres aux lecteurs d'écran. `floor` : valeur minimale de l'échelle, pour qu'une petite
 * valeur ne remplisse pas toute la hauteur.
 */
export function DayBars({
  days,
  today,
  caption,
  format,
  floor = 1,
}: {
  days: { date: string; value: number }[];
  today: string;
  caption: string;
  format: (value: number) => string;
  floor?: number;
}) {
  const max = Math.max(floor, ...days.map((d) => d.value));
  const compact = days.length > 7;

  return (
    <figure>
      <div aria-hidden className={cn("flex h-36 items-end", compact ? "gap-0.5" : "gap-2")}>
        {days.map(({ date, value }) => (
          <div key={date} className="flex h-full flex-1 flex-col justify-end">
            <div
              className={cn(
                "rounded-t-md border-2",
                value === 0 && "border-dashed opacity-40",
                date === today ? "bg-primary" : "bg-ink",
              )}
              style={{ height: value === 0 ? 4 : `${Math.max(4, (value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div
        aria-hidden
        className={cn(
          "mt-1.5 flex text-[11px] font-bold text-ink-soft",
          compact ? "gap-0.5" : "gap-2",
        )}
      >
        {days.map(({ date }, index) => (
          <span key={date} className="flex-1 text-center">
            {compact
              ? (days.length - 1 - index) % 7 === 0
                ? utc(date).getUTCDate()
                : ""
              : weekday.format(utc(date))}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <tbody>
          {days.map(({ date, value }) => (
            <tr key={date}>
              <th scope="row">{longDay.format(utc(date))}</th>
              <td>{format(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Courbe de la moyenne du semestre, avec le seuil de 10 en pointillés. */
export function AverageLine({ points }: { points: { date: string; average: number }[] }) {
  const W = 320;
  const H = 140;
  const pad = 12;
  const x = (i: number) => pad + (i / Math.max(1, points.length - 1)) * (W - 2 * pad);
  const y = (value: number) => pad + (1 - value / 20) * (H - 2 * pad);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i)} ${y(p.average)}`).join(" ");
  const last = points.at(-1);

  return (
    <figure>
      <div className="flex gap-2">
        <div
          aria-hidden
          className="flex flex-col justify-between py-0.5 text-[11px] font-bold text-ink-soft"
        >
          <span>20</span>
          <span>10</span>
          <span>0</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" aria-hidden>
          <line
            x1={pad}
            x2={W - pad}
            y1={y(PASSING_GRADE)}
            y2={y(PASSING_GRADE)}
            className="stroke-ink-soft"
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />
          <path
            d={path}
            fill="none"
            className="stroke-ink"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {points.map((p, i) => (
            <circle
              key={p.date}
              cx={x(i)}
              cy={y(p.average)}
              r={p === last ? 6 : 4}
              strokeWidth="2"
              className={cn(
                "stroke-ink",
                p.average >= PASSING_GRADE ? "fill-green" : "fill-pink",
                p === last && "fill-primary",
              )}
            />
          ))}
        </svg>
      </div>
      <div
        aria-hidden
        className="mt-1.5 flex justify-between pl-6 text-[11px] font-bold text-ink-soft"
      >
        <span>{formatDate(points[0].date)}</span>
        {points.length > 1 && <span>{formatDate(points.at(-1)!.date)}</span>}
      </div>
      <ol className="sr-only">
        {points.map((p) => (
          <li key={p.date}>
            {formatDate(p.date)} : {formatAverage(p.average)}
          </li>
        ))}
      </ol>
    </figure>
  );
}
