import {
  IMPORT_FIELDS,
  normalizeAssetType,
  normalizeKey,
  normalizeStatus,
} from "@/lib/import/fields";
import type { ParsedSheet } from "@/lib/import/parse";
import type {
  ColumnMapping,
  ImportKind,
  ImportRow,
  PreviewResult,
  PreviewRow,
  PreviewStatus,
} from "@/lib/import/types";

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function cellAt(cells: string[], index: number): string {
  if (index < 0 || index >= cells.length) {
    return "";
  }
  return (cells[index] ?? "").trim();
}

export function mapColumns(
  kind: ImportKind,
  headers: string[],
): ColumnMapping[] {
  const normalizedHeaders = headers.map(normalizeKey);

  return IMPORT_FIELDS[kind].map((spec) => {
    const index = normalizedHeaders.findIndex((header) =>
      spec.aliases.some((alias) => normalizeKey(alias) === header),
    );
    return {
      field: spec.field,
      label: spec.label,
      index,
      sourceColumn: index >= 0 ? headers[index] : null,
    };
  });
}

function transform(kind: ImportKind, field: string, raw: string): string {
  if (kind === "assets" && field === "status") {
    return normalizeStatus(raw);
  }
  if (kind === "assets" && field === "assetType") {
    return normalizeAssetType(raw);
  }
  return raw.trim();
}

function extractValues(
  kind: ImportKind,
  mapping: ColumnMapping[],
  cells: string[],
): ImportRow {
  const values: ImportRow = {};
  for (const column of mapping) {
    values[column.field] = transform(kind, column.field, cellAt(cells, column.index));
  }
  return values;
}

export function validateValues(kind: ImportKind, values: ImportRow): string[] {
  const issues: string[] = [];

  if (kind === "employees") {
    if (!values.firstName && !values.lastName) {
      issues.push("Renseignez au moins un nom ou un prénom.");
    }
    if (values.email && !EMAIL_PATTERN.test(values.email)) {
      issues.push("Adresse e-mail invalide.");
    }
    return issues;
  }

  if (!values.assetTag && !values.serialNumber) {
    issues.push("Renseignez un numéro d'inventaire ou un numéro de série.");
  }
  return issues;
}

export function keyOf(kind: ImportKind, values: ImportRow): string | null {
  if (kind === "employees") {
    const matricule = values.matricule?.trim();
    return matricule ? matricule.toLowerCase() : null;
  }
  const tag = values.assetTag?.trim();
  return tag ? tag.toLowerCase() : null;
}

export function buildPreview(
  kind: ImportKind,
  sheet: ParsedSheet,
): PreviewResult {
  const mapping = mapColumns(kind, sheet.headers);

  if (mapping.every((column) => column.index < 0)) {
    throw new Error(
      "Aucune colonne reconnue. Téléchargez le modèle ou vérifiez les en-têtes du fichier.",
    );
  }

  const seen = new Map<string, number>();
  const rows: PreviewRow[] = [];
  let ready = 0;
  let invalid = 0;
  let duplicates = 0;

  sheet.rows.forEach((cells, position) => {
    const rowNumber = sheet.headerRow + 1 + position;
    const values = extractValues(kind, mapping, cells);

    if (cells.every((cell) => cell.trim().length === 0)) {
      return;
    }

    const issues = validateValues(kind, values);
    const key = keyOf(kind, values);
    let status: PreviewStatus = issues.length > 0 ? "error" : "ok";

    if (status === "ok" && key) {
      const firstRow = seen.get(key);
      if (firstRow !== undefined) {
        status = "duplicate";
        issues.push(`Doublon du fichier : première occurrence ligne ${firstRow}.`);
      } else {
        seen.set(key, rowNumber);
      }
    }

    if (status === "ok") {
      ready += 1;
    } else if (status === "duplicate") {
      duplicates += 1;
    } else {
      invalid += 1;
    }

    rows.push({ row: rowNumber, values, key, status, issues });
  });

  return {
    kind,
    fileName: sheet.fileName,
    sheetName: sheet.sheetName,
    headers: sheet.headers,
    mapping,
    rows,
    summary: { total: rows.length, ready, invalid, duplicates },
  };
}

function nullable(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function compact(
  data: Record<string, string | null>,
): Record<string, string> {
  const patch: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string" && value.trim().length > 0) {
      patch[key] = value;
    }
  }
  return patch;
}

export function toEmployeeData(values: ImportRow): Record<string, string | null> {
  return {
    matricule: nullable(values.matricule),
    first_name: nullable(values.firstName),
    last_name: nullable(values.lastName),
    service: nullable(values.service),
    job_title: nullable(values.jobTitle),
    email: nullable(values.email),
    phone: nullable(values.phone),
    location: nullable(values.location),
  };
}

export function toEmployeePatch(values: ImportRow): Record<string, string> {
  return compact(toEmployeeData(values));
}

export function toAssetData(values: ImportRow): Record<string, string | null> {
  return {
    asset_tag: nullable(values.assetTag),
    serial_number: nullable(values.serialNumber),
    manufacturer: nullable(values.manufacturer),
    model: nullable(values.model),
    asset_type: nullable(values.assetType),
    os: nullable(values.os),
    status: values.status || "UNKNOWN",
    notes: nullable(values.notes),
  };
}

export function toAssetPatch(values: ImportRow): Record<string, string> {
  return compact(toAssetData(values));
}
