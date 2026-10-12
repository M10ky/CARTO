"use server";

import { revalidatePath } from "next/cache";

import { ensureEditor } from "@/lib/actions/common";
import { isImportKind } from "@/lib/import/fields";
import { parseSpreadsheet } from "@/lib/import/parse";
import {
  buildPreview,
  keyOf,
  toAssetData,
  toAssetPatch,
  toEmployeeData,
  toEmployeePatch,
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

type DataRecord = Record<string, string | null>;

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
  return kind === "employees" ? "employees" : "pc_assets";
}

function keyColumn(kind: ImportKind): string {
  return kind === "employees" ? "matricule" : "asset_tag";
}

function buildData(kind: ImportKind, values: PreviewRow["values"]): DataRecord {
  return kind === "employees" ? toEmployeeData(values) : toAssetData(values);
}

function buildPatch(
  kind: ImportKind,
  values: PreviewRow["values"],
): Record<string, string> {
  return kind === "employees" ? toEmployeePatch(values) : toAssetPatch(values);
}

function friendlyError(kind: ImportKind, message: string): string {
  if (message.includes("duplicate key")) {
    return kind === "employees"
      ? "Ce matricule est déjà utilisé par un autre collaborateur."
      : "Ce numéro d'inventaire est déjà utilisé par un autre équipement.";
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

      const raw =
        kind === "employees"
          ? (values.matricule ?? "").trim()
          : (values.assetTag ?? "").trim();
      keyed.push({
        row: row.row,
        raw,
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

  revalidatePath("/import");
  revalidatePath(kind === "employees" ? "/employees" : "/assets");
  revalidatePath("/");

  return { ok: true, inserted, updated, skipped, issues };
}
