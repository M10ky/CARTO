import {
  ChartColumn,
  LayoutDashboard,
  Map,
  Monitor,
  Settings,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
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

export function findNavItem(pathname: string): NavItem | undefined {
  if (pathname === "/") {
    return NAV_ITEMS[0];
  }
  return NAV_ITEMS.filter((item) => item.href !== "/").find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}
