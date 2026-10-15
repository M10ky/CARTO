"use client";

"use client";

import { Plus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { saveSetting } from "@/lib/actions/admin";
import type { ActionResult } from "@/lib/actions/common";
import type { SettingsResult } from "@/lib/data/admin";

type Feedback = { tone: "success" | "danger"; message: string };

export function SettingsPanel({ result }: { result: SettingsResult }) {
  return (
    <Panel>
      <PanelHeader
        title="Paramètres de l'application"
        description="Clés et valeurs enregistrées dans « app_settings » — utilisées par les pages et l'import."
      />
      <PanelBody>
        {!result.available ? (
          <Alert tone="warning" title="Module indisponible">
            {result.error}
          </Alert>
        ) : result.entries.length === 0 ? (
          <Alert tone="info">Aucun paramètre enregistré pour le moment.</Alert>
        ) : (
          <SettingsList entries={result.entries} />
        )}
      </PanelBody>
    </Panel>
  );
}

function SettingsList({
  entries,
}: {
  entries: SettingsResult["entries"];
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  function done(result: ActionResult, successMessage: string) {
    if (result.ok) {
      setFeedback({ tone: "success", message: successMessage });
      router.refresh();
    } else {
      setFeedback({ tone: "danger", message: result.error });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {feedback ? (
        <Alert tone={feedback.tone}>{feedback.message}</Alert>
      ) : null}

      <NewSettingForm onResult={done} />

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Clé</TableHeaderCell>
            <TableHeaderCell>Valeur</TableHeaderCell>
            <TableHeaderCell>Mise à jour</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((entry) => (
            <SettingRow key={entry.key} entry={entry} onResult={done} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function NewSettingForm({
  onResult,
}: {
  onResult: (result: ActionResult, successMessage: string) => void;
}) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveSetting({ key, value });
      onResult(result, "Paramètre enregistré.");
      if (result.ok) {
        setKey("");
        setValue("");
      }
    });
  }

  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded border border-line bg-ink-900/50 p-3"
      onSubmit={submit}
    >
      <Field label="Clé" htmlFor="ns-key" className="w-64">
        <Input
          id="ns-key"
          value={key}
          maxLength={80}
          required
          placeholder="ex. site_name"
          onChange={(event) => setKey(event.target.value)}
        />
      </Field>
      <Field label="Valeur" htmlFor="ns-value" className="min-w-64 flex-1">
        <Input
          id="ns-value"
          value={value}
          required
          placeholder="ex. Bâtiment A — Rez-de-chaussée"
          onChange={(event) => setValue(event.target.value)}
        />
      </Field>
      <Button type="submit" variant="primary" size="sm" disabled={pending}>
        <Plus aria-hidden className="size-3.5" />
        Ajouter
      </Button>
    </form>
  );
}

function SettingRow({
  entry,
  onResult,
}: {
  entry: SettingsResult["entries"][number];
  onResult: (result: ActionResult, successMessage: string) => void;
}) {
  const [draft, setDraft] = useState(entry.value);
  const [pending, startTransition] = useTransition();

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveSetting({ key: entry.key, value: draft });
      onResult(result, "Paramètre enregistré.");
    });
  }

  return (
    <TableRow>
      <TableCell>
        <span className="font-mono text-xs">{entry.key}</span>
        {entry.description ? (
          <p className="mt-0.5 text-xs text-text-faint">{entry.description}</p>
        ) : null}
      </TableCell>
      <TableCell>
        <form className="flex items-center gap-2" onSubmit={save}>
          <Input
            aria-label={`Valeur de ${entry.key}`}
            value={draft}
            maxLength={500}
            className="max-w-md"
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={pending || draft === entry.value}
          >
            <Save aria-hidden className="size-3.5" />
          </Button>
        </form>
      </TableCell>
      <TableCell>
        {entry.updatedAt ? (
          <Badge tone="neutral" className="font-mono">
            {new Date(entry.updatedAt).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Badge>
        ) : (
          <span className="text-xs text-text-faint">jamais</span>
        )}
      </TableCell>
    </TableRow>
  );
}