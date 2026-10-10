import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const metadata: Metadata = { title: "Administration" };

export default function SettingsPage() {
  return (
    <ModulePlaceholder
      module="G"
      title="Administration"
      description="Utilisateurs, rôles, paramétrage de l'application et journaux d'audit."
      phase="Phase 4 (rôles) puis Phase 8 (paramétrage)"
      planned={[
        "Gestion des utilisateurs et attribution des rôles",
        "Paramétrage des états de position",
        "Gestion des zones et rangées",
        "Paramètres de l'application",
        "Consultation des journaux d'audit",
      ]}
    />
  );
}
