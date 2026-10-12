import * as ExcelJS from "exceljs";

export type ParsedSheet = {
  fileName: string;
  sheetName: string;
  headers: string[];
  rows: string[][];
  headerRow: number;
};

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

function detectDelimiter(line: string): string {
  const candidates = [";", "\t", ",", "|"];
  let best = ",";
  let bestCount = 0;
  for (const candidate of candidates) {
    const count = line.split(candidate).length - 1;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
}

function splitDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char === "\r") {
      continue;
    } else {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows;
}

function firstFilledRow(matrix: string[][]): number {
  return matrix.findIndex((row) => row.some((cell) => cell.trim().length > 0));
}

function trimTrailingEmptyRows(matrix: string[][]): string[][] {
  let last = matrix.length - 1;
  while (last >= 0 && matrix[last].every((cell) => cell.trim().length === 0)) {
    last -= 1;
  }
  return matrix.slice(0, last + 1);
}

function parseCsv(fileName: string, text: string): ParsedSheet {
  const clean = text.replace(/^\uFEFF/, "");
  const firstLine = clean.split(/\r?\n/).find((line) => line.trim().length > 0) ?? "";
  const delimiter = detectDelimiter(firstLine);
  const matrix = trimTrailingEmptyRows(
    splitDelimited(clean, delimiter).map((row) =>
      row.map((cell) => cell.trim()),
    ),
  );

  const headerIndex = firstFilledRow(matrix);
  if (headerIndex < 0) {
    throw new Error("Le fichier ne contient aucune donnée.");
  }

  return {
    fileName,
    sheetName: "CSV",
    headers: matrix[headerIndex],
    rows: matrix.slice(headerIndex + 1),
    headerRow: headerIndex + 1,
  };
}

async function parseXlsx(file: File): Promise<ParsedSheet> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("Le classeur ne contient aucune feuille.");
  }

  const columnCount = Math.max(worksheet.columnCount, 1);
  const matrix: string[][] = [];
  for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const cells: string[] = [];
    for (let column = 1; column <= columnCount; column += 1) {
      cells.push(row.getCell(column).text.trim());
    }
    matrix.push(cells);
  }
  const trimmed = trimTrailingEmptyRows(matrix);

  const headerIndex = firstFilledRow(trimmed);
  if (headerIndex < 0) {
    throw new Error("Aucune ligne d'en-tête détectée dans le fichier.");
  }

  return {
    fileName: file.name,
    sheetName: worksheet.name,
    headers: trimmed[headerIndex],
    rows: trimmed.slice(headerIndex + 1),
    headerRow: headerIndex + 1,
  };
}

export async function parseSpreadsheet(file: File): Promise<ParsedSheet> {
  const extension = extensionOf(file.name);

  if (extension === ".csv" || extension === ".txt") {
    return parseCsv(file.name, await file.text());
  }
  if (extension === ".xlsx" || extension === ".xlsm") {
    return parseXlsx(file);
  }
  throw new Error(
    "Format non pris en charge : utilisez un fichier .xlsx ou .csv.",
  );
}
