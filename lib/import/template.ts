import * as ExcelJS from "exceljs";

import { TEMPLATE_HEADERS } from "@/lib/import/fields";
import type { ImportKind } from "@/lib/import/types";

export async function buildImportTemplate(
  kind: ImportKind,
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(
    kind === "employees" ? "Collaborateurs" : "Parc informatique",
  );

  const headers = TEMPLATE_HEADERS[kind];
  worksheet.addRow(headers);

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };

  headers.forEach((header, index) => {
    worksheet.getColumn(index + 1).width = Math.max(18, header.length + 4);
  });

  return workbook.xlsx.writeBuffer();
}
