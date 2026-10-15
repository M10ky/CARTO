import { Badge } from "@/components/ui/badge";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import type { AuditEntry } from "@/lib/data/admin";
import type { BadgeTone } from "@/components/ui/badge";

const actionTones: Record<string, BadgeTone> = {
  INSERT: "success",
  UPDATE: "info",
  DELETE: "danger",
};

const actionLabels: Record<string, string> = {
  INSERT: "Création",
  UPDATE: "Modification",
  DELETE: "Suppression",
};

export function AuditPanel({ entries }: { entries: AuditEntry[] }) {
  return (
    <Panel>
      <PanelHeader
        title="Journal d'audit"
        description={`Les 200 derniers événements (${entries.length}). Lecture seule.`}
      />
      <PanelBody className="p-0">
        {entries.length === 0 ? (
          <div className="p-4 text-sm text-text-dim">
            Aucun événement enregistré.
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
                <TableHeaderCell>Table</TableHeaderCell>
                <TableHeaderCell>Identifiant</TableHeaderCell>
                <TableHeaderCell>Contenu</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-xs whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge tone={actionTones[entry.action] ?? "neutral"}>
                      {actionLabels[entry.action] ?? entry.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">{entry.entity}</span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {entry.actorId?.slice(0, 8) ?? "—"}
                  </TableCell>
                  <TableCell>
                    {entry.diff ? (
                      <details className="text-xs text-text-dim">
                        <summary className="cursor-pointer text-text-faint hover:text-text-dim">
                          Détail
                        </summary>
                        <pre className="mt-2 overflow-x-auto rounded border border-line bg-ink-900 p-2 font-mono text-[11px] leading-relaxed text-text-faint">
                          {JSON.stringify(entry.diff, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span className="text-xs text-text-faint">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </PanelBody>
    </Panel>
  );
}