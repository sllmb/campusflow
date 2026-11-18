import { NextResponse } from "next/server";
import { getAdminAccess } from "@/features/admin/queries";
import { toCsv } from "@/features/forms/lib/results";
import { getFormResults } from "@/features/forms/queries";
import { getTimeZone } from "@/lib/timezone";

/** Téléchargement des réponses en CSV (admin avec code 2FA seulement). */
export async function GET(
  _request: Request,
  context: RouteContext<"/admin/formulaires/[formId]/export">,
) {
  const { formId } = await context.params;
  if ((await getAdminAccess()) !== "granted" || !/^[0-9a-f-]{36}$/.test(formId)) {
    return new NextResponse("Introuvable", { status: 404 });
  }
  const data = await getFormResults(formId);
  if (!data) return new NextResponse("Introuvable", { status: 404 });

  const timeZone = await getTimeZone();
  const date = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone,
  });
  const csv = toCsv(data.questions, data.responses, {
    nominative: !data.form.anonymous,
    formatDate: (iso) => date.format(new Date(iso)),
  });
  const name = data.form.title
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name || "formulaire"}-reponses.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
