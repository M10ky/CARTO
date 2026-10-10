import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const metadata: Metadata = { title: "Maintenance" };

export default function MaintenancePage() {
  return (
    <ModulePlaceholder
      module="E"
      title="Maintenance"
      description="Suivi des interventions sur les équipements du cluster."
      phase="Phase 8"
      planned={[
        "Création d'une intervention",
        "Équipement concerné et description du problème",
        "Intervention effectuée et technicien",
        "Statut et dates d'ouverture / clôture",
        "Historique des interventions",
      ]}
    />
  );
}
