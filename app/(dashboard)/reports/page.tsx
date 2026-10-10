import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const metadata: Metadata = { title: "Statistiques" };

export default function ReportsPage() {
  return (
    <ModulePlaceholder
      module="F"
      title="Statistiques et rapports"
      description="Indicateurs agrégés et exports calculés à partir des données réelles et des filtres actifs."
      phase="Phase 8"
      planned={[
        "Taux d'occupation des positions",
        "Répartition par zone",
        "Répartition des équipements par état ou catégorie",
        "Maintenance en cours et terminée",
        "Historique des imports",
        "Export CSV des données autorisées",
      ]}
    />
  );
}
