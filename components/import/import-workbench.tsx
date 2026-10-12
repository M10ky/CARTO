"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Download, FileSpreadsheet, Upload } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { analyzeImport, commitImport } from "@/lib/actions/import";
import { pcStatusLabel } from "@/lib/constants/inventory";
import { importKindLabel } from "@/lib/import/fields";
import type {
  CommitResult,
  ImportKind,
  PreviewResult,
  PreviewStatus,
} from "@/lib/import/types";
import { cn } from "@/lib/utils/cn";

const MAX_PREVIEW_ROWS = 100;

const statusConfig: Record<
  PreviewStatus,
  { label: string; tone: BadgeTone }
> = {
  ok: { label: "Prête", tone: "success" },
  error: { label: "Erreur", tone: "danger" },
  duplicate: { label: "Doublon", tone: "warning" },
};

function displayValue(field: string, value: string): string {
  if (field === "status" && value) {
    return pcStatusLabel(value);
  }
  return value || "—";
}

export function ImportWorkbench({
  initialKind = "employees",
}: {
  initialKind?: ImportKind;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [kind, setKind] = useState<ImportKind>(initialKind);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [report, setReport] = useState<CommitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, startAnalyze] = useTransition();
  const [committing, startCommit] = useTransition();

  function resetResults() {
    setPreview(null);
    setReport(null);
    setError(null);
  }

  function handleKindChange(value: string) {
    setKind(value === "assets" ? "assets" : "employees");
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    resetResults();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    resetResults();
  }

  function handleAnalyze() {
    if (!file) {
      setError("Sélectionnez d'abord un fichier Excel ou CSV.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    startAnalyze(async () => {
      resetResults();
      const result = await analyzeImport(kind, formData);
      if (result.ok) {
        setPreview(result.preview);
      } else {
        setError(result.error);
      }
    });
  }

  function handleCommit() {
    if (!preview) {
      return;
    }
    const readyRows = preview.rows.filter((row) => row.status === "ok");
    if (readyRows.length === 0) {
      return;
    }
    startCommit(async () => {
      setError(null);
      const result = await commitImport(kind, readyRows);
      if (result.ok) {
        setReport(result);
        setPreview(null);
        setFile(null);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const mappedColumns =
    preview?.mapping.filter((column) => column.index >= 0) ?? [];
  const visibleRows = preview?.rows.slice(0, MAX_PREVIEW_ROWS) ?? [];
  const readyCount = preview?.summary.ready ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <PanelHeader
          title="Fichier source"
          description="Excel (.xlsx) ou CSV. Les en-têtes sont reconnus automatiquement (avec variantes de libellé)."
        />
        <PanelBody className="flex flex-col gap-4">
          <div className="grid items-end gap-4 sm:grid-cols-2">
            <Field label="Type de données" htmlFor="import-kind">
              <Select
                id="import-kind"
                value={kind}
                onChange={(event) => handleKindChange(event.target.value)}
              >
                <option value="employees">Collaborateurs</option>
                <option value="assets">Parc informatique</option>
              </Select>
            </Field>
            <Field
              label="Fichier"
              htmlFor="import-file"
              hint="Taille maximale : 10 Mo."
            >
              <input
                ref={inputRef}
                id="import-file"
                type="file"
                accept=".xlsx,.xlsm,.csv,.txt"
                onChange={handleFileChange}
                className={cn(
                  "h-9 w-full rounded border border-line bg-ink-900 px-2 text-sm text-text-dim",
                  "file:mr-3 file:h-7 file:rounded file:border-0 file:bg-ink-700 file:px-3",
                  "file:text-xs file:font-medium file:text-text",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                )}
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAnalyze}
              disabled={analyzing || !file}
            >
              <Upload aria-hidden className="size-3.5" />
              {analyzing ? "Analyse…" : "Analyser le fichier"}
            </Button>
            <a
              href={`/api/import/template?kind=${kind}`}
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
            >
              <Download aria-hidden className="size-3.5" />
              Télécharger le modèle
            </a>
            <span className="font-mono text-[11px] text-text-faint">
              {importKindLabel(kind)}
            </span>
          </div>

          {error ? <Alert tone="danger">{error}</Alert> : null}

          {file && !preview && !error ? (
            <p className="flex items-center gap-2 text-xs text-text-dim">
              <FileSpreadsheet aria-hidden className="size-4 text-text-faint" />
              {file.name}
            </p>
          ) : null}
        </PanelBody>
      </Panel>

      {preview ? (
        <>
          <Panel>
            <PanelHeader
              title="Aperçu"
              description={`${preview.fileName} — feuille « ${preview.sheetName} »`}
              actions={
                <>
                  <Badge tone="success">{preview.summary.ready} prêtes</Badge>
                  <Badge tone="warning">
                    {preview.summary.duplicates} doublons
                  </Badge>
                  <Badge tone="danger">
                    {preview.summary.invalid} en erreur
                  </Badge>
                </>
              }
            />
            <PanelBody className="flex flex-col gap-4">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-faint">
                  Correspondance des colonnes
                </p>
                <div className="flex flex-wrap gap-2">
                  {preview.mapping.map((column) => (
                    <Badge
                      key={column.field}
                      tone={column.index >= 0 ? "accent" : "neutral"}
                    >
                      {column.label}
                      <span className="text-text-faint">
                        {column.sourceColumn ?? "non reconnue"}
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-text-dim">
                  Seules les lignes « prêtes » seront importées ; les doublons et
                  les erreurs sont ignorés et listés dans le rapport.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCommit}
                  disabled={committing || readyCount === 0}
                >
                  {committing
                    ? "Import en cours…"
                    : `Importer ${readyCount} ligne(s)`}
                </Button>
              </div>
            </PanelBody>
            <PanelBody className="p-0">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell className="text-right">Ligne</TableHeaderCell>
                    <TableHeaderCell>Statut</TableHeaderCell>
                    {mappedColumns.map((column) => (
                      <TableHeaderCell key={column.field}>
                        {column.label}
                      </TableHeaderCell>
                    ))}
                    <TableHeaderCell>Détail</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleRows.map((row) => {
                    const config = statusConfig[row.status];
                    return (
                      <TableRow key={row.row}>
                        <TableCell className="text-right font-mono text-xs tabular-nums">
                          {row.row}
                        </TableCell>
                        <TableCell>
                          <Badge tone={config.tone} dot>
                            {config.label}
                          </Badge>
                        </TableCell>
                        {mappedColumns.map((column) => (
                          <TableCell key={column.field}>
                            {displayValue(
                              column.field,
                              row.values[column.field] ?? "",
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="text-xs text-text-faint">
                          {row.issues.join(" ") || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {preview.rows.length > MAX_PREVIEW_ROWS ? (
                <p className="border-t border-line px-4 py-2 text-xs text-text-faint">
                  Affichage des {MAX_PREVIEW_ROWS} premières lignes sur{" "}
                  {preview.rows.length}. Toutes les lignes prêtes seront
                  importées.
                </p>
              ) : null}
            </PanelBody>
          </Panel>
        </>
      ) : null}

      {report && report.ok ? (
        <Panel>
          <PanelHeader
            title="Rapport d'import"
            actions={
              <>
                <Badge tone="success">{report.inserted} créés</Badge>
                <Badge tone="info">{report.updated} mis à jour</Badge>
                <Badge tone="warning">{report.skipped} ignorés</Badge>
              </>
            }
          />
          <PanelBody className="flex flex-col gap-3">
            <p className="text-sm text-text-dim">
              Import terminé : {report.inserted} création(s), {report.updated}{" "}
              mise(s) à jour, {report.skipped} ligne(s) ignorée(s).
            </p>
            {report.issues.length > 0 ? (
              <div className="max-h-64 overflow-y-auto rounded border border-line">
                <ul className="divide-y divide-line">
                  {report.issues.slice(0, 100).map((issue, index) => (
                    <li
                      key={`${issue.row}-${index}`}
                      className="flex gap-3 px-3 py-2 text-xs"
                    >
                      <span className="font-mono text-text-faint">
                        ligne {issue.row}
                      </span>
                      <span className="text-text-dim">{issue.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </PanelBody>
        </Panel>
      ) : null}
    </div>
  );
}
