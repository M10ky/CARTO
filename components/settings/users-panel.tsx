"use client";

import { Check, UserPen, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import {
  toggleUserActive,
  updateUserRole,
} from "@/lib/actions/admin";
import type { ActionResult } from "@/lib/actions/common";
import type { AdminUser } from "@/lib/data/admin";

type Feedback = { tone: "success" | "danger"; message: string };

const roleLabels: Record<AdminUser["role"], string> = {
  ADMIN: "Administrateur",
  MANAGER: "Gestionnaire",
  VIEWER: "Consultation",
};

export function UsersPanel({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
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
    <Panel>
      <PanelHeader
        title="Utilisateurs et rôles"
        description="Attribution des rôles et activation des comptes — vous ne pouvez pas modifier votre propre compte."
      />
      <PanelBody>
        {feedback ? (
          <Alert tone={feedback.tone} className="mb-3">
            {feedback.message}
          </Alert>
        ) : null}

        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Utilisateur</TableHeaderCell>
              <TableHeaderCell>Rôle</TableHeaderCell>
              <TableHeaderCell>Compte</TableHeaderCell>
              <TableHeaderCell>Membre depuis</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isSelf={user.id === currentUserId}
                onResult={done}
              />
            ))}
          </TableBody>
        </Table>
      </PanelBody>
    </Panel>
  );
}

function UserRow({
  user,
  isSelf,
  onResult,
}: {
  user: AdminUser;
  isSelf: boolean;
  onResult: (result: ActionResult, successMessage: string) => void;
}) {
  const [saving, startTransition] = useTransition();

  function run(action: Promise<ActionResult>, successMessage: string) {
    startTransition(async () => {
      const result = await action;
      onResult(result, successMessage);
    });
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          {!user.isActive && (
            <span className="text-text-faint" title="Compte désactivé">
              <UserX aria-hidden className="size-4" />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text">
              {user.fullName ?? "—"}
              {isSelf ? (
                <span className="ml-2 font-mono text-xs text-text-faint">
                  (vous)
                </span>
              ) : null}
            </p>
            <p className="truncate font-mono text-xs text-text-faint">
              {user.email ?? user.id}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Select
          aria-label={`Rôle de ${user.fullName ?? user.email ?? user.id}`}
          value={user.role}
          disabled={isSelf || saving}
          onChange={(event) =>
            run(
              updateUserRole({ userId: user.id, role: event.target.value }),
              "Rôle mis à jour.",
            )
          }
          className="w-44"
        >
          {Object.entries(roleLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </TableCell>
      <TableCell>
        {isSelf ? (
          <Badge tone="accent">Vous</Badge>
        ) : user.isActive ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={saving}
            onClick={() =>
              run(
                toggleUserActive({ userId: user.id, isActive: false }),
                "Compte désactivé.",
              )
            }
          >
            <Check aria-hidden className="size-3.5" />
            Actif
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            disabled={saving}
            onClick={() =>
              run(
                toggleUserActive({ userId: user.id, isActive: true }),
                "Compte réactivé.",
              )
            }
          >
            <UserPen aria-hidden className="size-3.5" />
            Réactiver
          </Button>
        )}
      </TableCell>
      <TableCell className="font-mono text-xs">
        {new Date(user.createdAt).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </TableCell>
    </TableRow>
  );
}