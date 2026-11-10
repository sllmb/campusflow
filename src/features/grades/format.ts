import { formatNumber } from "@/lib/format";
import { roundGrade } from "./lib/average";

const twoDecimals = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Moyenne affichée au centième : 10,33 ; « — » sans note. */
export function formatAverage(value: number | null) {
  return value === null ? "—" : twoDecimals.format(roundGrade(value));
}

/** Note telle que saisie : « 14/20 », « 8,5/10 ». */
export function formatScore(score: number, outOf: number) {
  return `${formatNumber(score)}/${formatNumber(outOf)}`;
}
