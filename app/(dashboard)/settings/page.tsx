import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";

import { AuditPanel } from "@/components/settings/audit-panel";
import { SeatStatusesPanel } from "@/components/settings/seat-statuses-panel";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { UsersPanel } from "@/components/settings/users-panel";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import {
  listAuditEntries,
  listSeatStatusesFull,
  listSettings,
  listUsers,
} from "@/lib/data/admin";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Administration" };

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (user?.role !== "ADMIN") {
    return (
      <>
        <PageHeader
          title="Administration"
          description="Paramétrage de l'application et journal d'audit."
        />
        <Alert tone="danger" title="Accès restreint">
          <span className="inline-flex items-center gap-2">
            <ShieldAlert aria-hidden className="size-4" />
            Cette page est réservée aux administrateurs.
          </span>
        </Alert>
      </>
    );
  }

  const [users, statuses, settingsResult, audit] = await Promise.all([
    listUsers(),
    listSeatStatusesFull(),
    listSettings(),
    listAuditEntries(200),
  ]);

  return (
    <>
      <PageHeader
        title="Administration"
        description="Utilisateurs et rôles, paramétrage des états de position, paramètres de l'application et journaux d'audit."
      />

      <div className="flex flex-col gap-4">
        <UsersPanel users={users} currentUserId={user.id} />
        <SeatStatusesPanel statuses={statuses} />
        <SettingsPanel result={settingsResult} />
        <AuditPanel entries={audit} />
      </div>
    </>
  );
}