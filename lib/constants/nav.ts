import {
  ChartColumn,
  FileSpreadsheet,
  LayoutDashboard,
  Map,
  Monitor,
  Settings,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type NavItem = NavLink & {
  /** Module fonctionnel du cahier des charges. */
  module: "A" | "B" | "C" | "D" | "E" | "F" | "G";
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Tableau de bord",
    description: "Indicateurs du cluster",
    icon: LayoutDashboard,
    module: "A",
  },
  {
    href: "/cluster",
    label: "Cartographie",
    description: "Plan physique interactif",
    icon: Map,
    module: "B",
  },
  {
    href: "/employees",
    label: "Collaborateurs",
    description: "Fiches et affectations",
    icon: Users,
    module: "C",
  },
  {
    href: "/assets",
    label: "Parc informatique",
    description: "Inventaire et équipements",
    icon: Monitor,
    module: "D",
  },
  {
    href: "/maintenance",
    label: "Maintenance",
    description: "Interventions et suivi",
    icon: Wrench,
    module: "E",
  },
  {
    href: "/reports",
    label: "Statistiques",
    description: "Rapports et exports",
    icon: ChartColumn,
    module: "F",
  },
  {
    href: "/settings",
    label: "Administration",
    description: "Utilisateurs, rôles, paramètres",
    icon: Settings,
    module: "G",
  },
];

export const TOOL_ITEMS: NavLink[] = [
  {
    href: "/import",
    label: "Import Excel / CSV",
    description: "Intégrer des données externes",
    icon: FileSpreadsheet,
  },
];

export function matchesPath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findNavItem(pathname: string): NavLink | undefined {
  return [...NAV_ITEMS, ...TOOL_ITEMS].find((item) =>
    matchesPath(pathname, item.href),
  );
}
