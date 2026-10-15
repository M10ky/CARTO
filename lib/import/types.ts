export type ImportKind = "assets" | "seats";

export type ImportFieldType = "text" | "email";

export type ImportFieldSpec = {
  field: string;
  label: string;
  aliases: string[];
  type?: ImportFieldType;
};

export type ImportRow = Record<string, string>;

export type ColumnMapping = {
  field: string;
  label: string;
  sourceColumn: string | null;
  index: number;
};

export type PreviewStatus = "ok" | "error" | "duplicate";

export type PreviewRow = {
  row: number;
  values: ImportRow;
  key: string | null;
  status: PreviewStatus;
  issues: string[];
};

export type PreviewSummary = {
  total: number;
  ready: number;
  invalid: number;
  duplicates: number;
};

export type PreviewResult = {
  kind: ImportKind;
  fileName: string;
  sheetName: string;
  headers: string[];
  mapping: ColumnMapping[];
  rows: PreviewRow[];
  summary: PreviewSummary;
};

export type AnalyzeResult =
  | { ok: true; preview: PreviewResult }
  | { ok: false; error: string };

export type ImportIssue = { row: number; message: string };

export type CommitResult =
  | {
      ok: true;
      inserted: number;
      updated: number;
      skipped: number;
      issues: ImportIssue[];
    }
  | { ok: false; error: string };
