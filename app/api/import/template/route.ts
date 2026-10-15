import { getCurrentUser } from "@/lib/auth/session";
import { isImportKind } from "@/lib/import/fields";
import { buildImportTemplate } from "@/lib/import/template";

const CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    return new Response("Accès refusé.", { status: 403 });
  }

  const kind = new URL(request.url).searchParams.get("kind");
  if (!isImportKind(kind)) {
    return new Response("Type d'import inconnu.", { status: 400 });
  }

  const body = await buildImportTemplate(kind);
  const fileName =
    kind === "assets"
      ? "modele-import-parc-informatique.xlsx"
      : "modele-import-positions.xlsx";

  return new Response(body, {
    headers: {
      "Content-Type": CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
