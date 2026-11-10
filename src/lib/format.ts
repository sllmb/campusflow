const numberFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** 6.5 → « 6,5 » */
export function formatNumber(value: number) {
  return numberFormat.format(value);
}

/** « 2026-09-15 » (date sans heure) → « 15 sept. 2026 » */
export function formatDate(isoDate: string) {
  return dateFormat.format(new Date(`${isoDate}T00:00:00Z`));
}

/** « 1 crédit », « 6 crédits » */
export function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${formatNumber(count)} ${count > 1 || count === 0 ? pluralForm : singular}`;
}
