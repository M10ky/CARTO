import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const metadata: Metadata = { title: "Tableau de bord" };

export default function DashboardPage() {
  return (
    <ModulePlaceholder
      module="A"
      title="Tableau de bord"
      description="Indicateurs du Cluster CNTO calculés à partir de la base de données."
      phase="Phase 4 & 5"
      planned={[
        "Nombre de zones et de positions",
        "Positions occupées, libres et indisponibles",
        "Nombre de collaborateurs référencés",
        "Nombre d'équipements et équipements en maintenance",
        "Derniers imports et dernières opérations",
      ]}
    />
  );
}
