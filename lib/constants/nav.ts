import {
  ChartColumn,
  FileSpreadsheet,
  LayoutDashboard,
  Map,
  Monitor,
  Settings,
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
  module: "A" | "B" | "C" | "D" | "E" | "F";
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
    href: "/assets",
    label: "Parc informatique",
    description: "Inventaire et équipements",
    icon: Monitor,
    module: "C",
  },
  {
    href: "/maintenance",
    label: "Maintenance",
    description: "Interventions et suivi",
    icon: Wrench,
    module: "D",
  },
  {
    href: "/reports",
    label: "Statistiques",
    description: "Rapports et exports",
    icon: ChartColumn,
    module: "E",
  },
  {
    href: "/settings",
    label: "Administration",
    description: "Utilisateurs, rôles, paramètres",
    icon: Settings,
    module: "F",
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
