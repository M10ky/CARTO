"use server";

import { revalidatePath } from "next/cache";

import { ensureEditor } from "@/lib/actions/common";
import { isImportKind, normalizeKey } from "@/lib/import/fields";
import { parseSpreadsheet } from "@/lib/import/parse";
import {
  buildPreview,
  keyOf,
  toAssetData,
  toAssetPatch,
  validateValues,
} from "@/lib/import/validate";
import type {
  AnalyzeResult,
  CommitResult,
  ImportIssue,
  ImportKind,
  PreviewRow,
} from "@/lib/import/types";
import { createClient } from "@/lib/supabase/server";

const EDITOR_ONLY = "Action réservée aux administrateurs et gestionnaires.";

type DbClient = Awaited<ReturnType<typeof createClient>>;

type DataRecord = Record<string, string | number | null>;

type KeyedItem = {
  row: number;
  raw: string;
  key: string;
  data: DataRecord;
  patch: Record<string, string>;
};

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

function tableName(kind: ImportKind): string {
  return kind === "assets" ? "pc_assets" : "seats";
}

function keyColumn(kind: ImportKind): string {
  return kind === "assets" ? "asset_tag" : "code";
}

function buildData(kind: ImportKind, values: PreviewRow["values"]): DataRecord {
  return toAssetData(values);
}

function buildPatch(
  kind: ImportKind,
  values: PreviewRow["values"],
): Record<string, string> {
  return toAssetPatch(values);
}

function friendlyError(kind: ImportKind, message: string): string {
  if (message.includes("duplicate key")) {
    return kind === "assets"
      ? "Ce numéro d'inventaire est déjà utilisé par un autre équipement."
      : "Ce code de position est déjà utilisé.";
  }
  if (
    kind === "seats" &&
    (message.includes("seat_statuses") || message.includes("foreign key"))
  ) {
    return "Statut de position inconnu ou zone introuvable.";
  }
  return message;
}

async function fetchExisting(
  supabase: DbClient,
  kind: ImportKind,
  raws: string[],
): Promise<Map<string, string>> {
  const existing = new Map<string, string>();
  const column = keyColumn(kind);

  for (const chunk of chunks([...new Set(raws)], 200)) {
    const { data, error } = await supabase
      .from(tableName(kind))
      .select(`id, ${column}`)
      .in(column, chunk);

    if (error) {
      throw new Error(error.message);
    }
    for (const row of (data ?? []) as unknown as Record<
      string,
      string | null
    >[]) {
      const value = row[column];
      const id = row.id;
      if (value && id) {
        existing.set(value, id);
      }
    }
  }

  return existing;
}

export async function analyzeImport(
  kind: ImportKind,
  formData: FormData,
): Promise<AnalyzeResult> {
  if (!(await ensureEditor())) {
    return { ok: false, error: EDITOR_ONLY };
  }
  if (!isImportKind(kind)) {
    return { ok: false, error: "Type d'import inconnu." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "Aucun fichier transmis." };
  }
  if (file.size === 0) {
    return { ok: false, error: "Le fichier sélectionné est vide." };
  }

  try {
    const sheet = await parseSpreadsheet(file);
    return { ok: true, preview: buildPreview(kind, sheet) };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Lecture du fichier impossible.",
    };
  }
}

export async function commitImport(
  kind: ImportKind,
  rows: PreviewRow[],
): Promise<CommitResult> {
  if (!(await ensureEditor())) {
    return { ok: false, error: EDITOR_ONLY };
  }
  if (!isImportKind(kind)) {
    return { ok: false, error: "Type d'import inconnu." };
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, error: "Aucune ligne à importer." };
  }

  const supabase = await createClient();

  if (kind === "seats") {
    return commitSeats(supabase, rows);
  }
  return commitAssets(supabase, rows);
}

async function commitAssets(
  supabase: DbClient,
  rows: PreviewRow[],
): Promise<CommitResult> {
  const kind: ImportKind = "assets";
  const issues: ImportIssue[] = [];
  const keyed: KeyedItem[] = [];
  const unkeyed: { row: number; data: DataRecord }[] = [];
  const seen = new Map<string, number>();
  let skipped = 0;

  for (const row of rows) {
    const values = row.values ?? {};
    const invalid = validateValues(kind, values);
    if (invalid.length > 0) {
      issues.push({ row: row.row, message: invalid.join(" ") });
      skipped += 1;
      continue;
    }

    const key = keyOf(kind, values);
    if (key) {
      const firstRow = seen.get(key);
      if (firstRow !== undefined) {
        issues.push({
          row: row.row,
          message: `Doublon ignoré (déjà importé ligne ${firstRow}).`,
        });
        skipped += 1;
        continue;
      }
      seen.set(key, row.row);

      keyed.push({
        row: row.row,
        raw: (values.assetTag ?? "").trim(),
        key,
        data: buildData(kind, values),
        patch: buildPatch(kind, values),
      });
    } else {
      unkeyed.push({ row: row.row, data: buildData(kind, values) });
    }
  }

  let existing: Map<string, string>;
  try {
    existing = await fetchExisting(
      supabase,
      kind,
      keyed.map((item) => item.raw),
    );
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Lecture des données existantes impossible.",
    };
  }

  const toInsert: { row: number; data: DataRecord }[] = [...unkeyed];
  const toUpdate: { row: number; id: string; patch: Record<string, string> }[] =
    [];

  for (const item of keyed) {
    const id = existing.get(item.raw);
    if (id) {
      toUpdate.push({ row: item.row, id, patch: item.patch });
    } else {
      toInsert.push({ row: item.row, data: item.data });
    }
  }

  let inserted = 0;
  let updated = 0;

  for (const item of toUpdate) {
    if (Object.keys(item.patch).length === 0) {
      updated += 1;
      continue;
    }
    const { error } = await supabase
      .from(tableName(kind))
      .update(item.patch)
      .eq("id", item.id);
    if (error) {
      issues.push({ row: item.row, message: friendlyError(kind, error.message) });
      skipped += 1;
    } else {
      updated += 1;
    }
  }

  for (const chunk of chunks(toInsert, 300)) {
    const { error } = await supabase
      .from(tableName(kind))
      .insert(chunk.map((item) => item.data));

    if (!error) {
      inserted += chunk.length;
      continue;
    }

    for (const item of chunk) {
      const { error: rowError } = await supabase
        .from(tableName(kind))
        .insert(item.data);
      if (rowError) {
        issues.push({
          row: item.row,
          message: friendlyError(kind, rowError.message),
        });
        skipped += 1;
      } else {
        inserted += 1;
      }
    }
  }

  revalidatePaths(kind);
  return { ok: true, inserted, updated, skipped, issues };
}

function nullable(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function compact(
  data: Record<string, string | number | null>,
): Record<string, string> {
  const patch: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string" && value.trim().length > 0) {
      patch[key] = value;
    }
  }
  return patch;
}

async function commitSeats(
  supabase: DbClient,
  rows: PreviewRow[],
): Promise<CommitResult> {
  const kind: ImportKind = "seats";
  const issues: ImportIssue[] = [];

  const [zonesResult, statusesResult, zoneRowsResult] = await Promise.all([
    supabase.from("zones").select("id, code, name"),
    supabase.from("seat_statuses").select("code, label"),
    supabase.from("zone_rows").select("id, zone_id, label, sort_order"),
  ]);

  const referenceError =
    zonesResult.error ?? statusesResult.error ?? zoneRowsResult.error;
  if (referenceError) {
    return { ok: false, error: referenceError.message };
  }

  const zones = (zonesResult.data ?? []) as {
    id: string;
    code: string;
    name: string;
  }[];
  const zoneByKey = new Map<string, string>();
  for (const zone of zones) {
    zoneByKey.set(normalizeKey(zone.code), zone.id);
    zoneByKey.set(normalizeKey(zone.name), zone.id);
  }

  const statusByKey = new Map<string, string>();
  for (const status of (statusesResult.data ?? []) as {
    code: string;
    label: string;
  }[]) {
    statusByKey.set(normalizeKey(status.code), status.code);
    statusByKey.set(normalizeKey(status.label), status.code);
  }

  const zoneRows = (zoneRowsResult.data ?? []) as {
    id: string;
    zone_id: string;
    label: string;
    sort_order: number;
  }[];
  const rowsByZoneLabel = new Map<string, Map<string, string>>();
  const nextOrderByZone = new Map<string, number>();
  for (const zoneRow of zoneRows) {
    const withinZone = rowsByZoneLabel.get(zoneRow.zone_id) ?? new Map();
    withinZone.set(normalizeKey(zoneRow.label), zoneRow.id);
    rowsByZoneLabel.set(zoneRow.zone_id, withinZone);
    const next = (nextOrderByZone.get(zoneRow.zone_id) ?? 0) + 1;
    if (zoneRow.sort_order >= next) {
      nextOrderByZone.set(zoneRow.zone_id, zoneRow.sort_order + 1);
    }
  }

  const keyed: (KeyedItem & {
    zoneId: string;
    rowLabel: string | null;
    rowCandidate: { zoneId: string; label: string } | null;
  })[] = [];
  const seen = new Map<string, number>();
  let skipped = 0;

  for (const row of rows) {
    const values = row.values ?? {};
    const invalid = validateValues(kind, values);
    if (invalid.length > 0) {
      issues.push({ row: row.row, message: invalid.join(" ") });
      skipped += 1;
      continue;
    }

    const key = keyOf(kind, values);
    if (!key) {
      issues.push({ row: row.row, message: "Code de position manquant." });
      skipped += 1;
      continue;
    }

    const firstRow = seen.get(key);
    if (firstRow !== undefined) {
      issues.push({
        row: row.row,
        message: `Doublon du fichier : première occurrence ligne ${firstRow}.`,
      });
      skipped += 1;
      continue;
    }
    seen.set(key, row.row);

    const zoneId = zoneByKey.get(normalizeKey(values.zone ?? ""));
    if (!zoneId) {
      issues.push({
        row: row.row,
        message: `Zone « ${values.zone} » introuvable dans le plan.`,
      });
      skipped += 1;
      continue;
    }

    const rawStatus = values.status?.trim() ?? "";
    const status = rawStatus
      ? (statusByKey.get(normalizeKey(rawStatus)) ?? "")
      : "FREE";
    if (!status) {
      issues.push({
        row: row.row,
        message: `Statut « ${rawStatus} » inconnu (voir Administration > Statuts de position).`,
      });
      skipped += 1;
      continue;
    }

    const rowLabel = nullable(values.row);
    let existingRowId: string | null = null;
    if (rowLabel) {
      existingRowId = rowsByZoneLabel.get(zoneId)?.get(normalizeKey(rowLabel)) ?? null;
    }

    const gridRowRaw = values.gridRow?.trim() ?? "";
    const gridRow = /^\d+$/.test(gridRowRaw) ? Number(gridRowRaw) : null;

    const data: DataRecord = {
      code: (values.code ?? "").trim(),
      label: nullable(values.label),
      zone_id: zoneId,
      row_id: existingRowId,
      status,
      grid_row: gridRow,
      grid_col: nullable(values.gridCol),
      kind: "SEAT",
    };

    keyed.push({
      row: row.row,
      raw: (values.code ?? "").trim(),
      key,
      data,
      patch: compact(data),
      zoneId,
      rowLabel: rowLabel ?? null,
      rowCandidate:
        rowLabel && !existingRowId
          ? { zoneId, label: rowLabel }
          : null,
    });
  }

  let existing: Map<string, string>;
  try {
    existing = await fetchExisting(
      supabase,
      kind,
      keyed.map((item) => item.raw),
    );
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Lecture des données existantes impossible.",
    };
  }

  const rowCandidates = new Map<string, { zoneId: string; label: string }>();
  for (const item of keyed) {
    if (!item.rowCandidate) {
      continue;
    }
    const lookedUp = rowsByZoneLabel
      .get(item.rowCandidate.zoneId)
      ?.get(normalizeKey(item.rowCandidate.label));
    if (lookedUp) {
      item.data.row_id = lookedUp;
      item.rowCandidate = null;
      continue;
    }
    const dedupeKey = `${item.rowCandidate.zoneId}:${normalizeKey(item.rowCandidate.label)}`;
    if (!rowCandidates.has(dedupeKey)) {
      rowCandidates.set(dedupeKey, item.rowCandidate);
    }
  }

  const createdRowIds = new Map<string, string>();
  if (rowCandidates.size > 0) {
    for (const [dedupeKey, candidate] of rowCandidates) {
      const sortOrder = nextOrderByZone.get(candidate.zoneId) ?? 1;
      nextOrderByZone.set(candidate.zoneId, sortOrder + 1);
      const { data: createdRow, error: createError } = await supabase
        .from("zone_rows")
        .insert({
          zone_id: candidate.zoneId,
          label: candidate.label,
          sort_order: sortOrder,
        })
        .select("id")
        .single();
      if (createError) {
        issues.push({
          row: -1,
          message: `Rangée « ${candidate.label} » non créée : ${createError.message}`,
        });
        continue;
      }
      if (createdRow?.id) {
        createdRowIds.set(dedupeKey, createdRow.id);
      }
    }
  }

  for (const item of keyed) {
    if (!item.rowCandidate) {
      continue;
    }
    const dedupeKey = `${item.rowCandidate.zoneId}:${normalizeKey(item.rowCandidate.label)}`;
    const rowId = createdRowIds.get(dedupeKey);
    if (rowId) {
      item.data.row_id = rowId;
      item.patch = compact(item.data);
    }
  }

  const toInsert: { row: number; data: DataRecord }[] = [];
  const toUpdate: { row: number; id: string; patch: Record<string, string> }[] =
    [];

  for (const item of keyed) {
    const id = existing.get(item.raw);
    if (id) {
      toUpdate.push({ row: item.row, id, patch: item.patch });
    } else {
      toInsert.push({ row: item.row, data: item.data });
    }
  }

  let inserted = 0;
  let updated = 0;

  for (const item of toUpdate) {
    if (Object.keys(item.patch).length === 0) {
      updated += 1;
      continue;
    }
    const { error } = await supabase
      .from(tableName(kind))
      .update(item.patch)
      .eq("id", item.id);
    if (error) {
      issues.push({ row: item.row, message: friendlyError(kind, error.message) });
      skipped += 1;
    } else {
      updated += 1;
    }
  }

  for (const chunk of chunks(toInsert, 300)) {
    const { error } = await supabase
      .from(tableName(kind))
      .insert(chunk.map((item) => item.data));

    if (!error) {
      inserted += chunk.length;
      continue;
    }

    for (const item of chunk) {
      const { error: rowError } = await supabase
        .from(tableName(kind))
        .insert(item.data);
      if (rowError) {
        issues.push({
          row: item.row,
          message: friendlyError(kind, rowError.message),
        });
        skipped += 1;
      } else {
        inserted += 1;
      }
    }
  }

  revalidatePaths(kind);
  return { ok: true, inserted, updated, skipped, issues };
}

function revalidatePaths(kind: ImportKind) {
  revalidatePath("/import");
  revalidatePath(kind === "assets" ? "/assets" : "/cluster");
  revalidatePath("/");
}