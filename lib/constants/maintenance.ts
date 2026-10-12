import type { BadgeTone } from "@/components/ui/badge";
import type { MaintenancePriority, MaintenanceStatus } from "@/types/maintenance";

export type MaintenanceStatusOption = {
  code: MaintenanceStatus;
  label: string;
  tone: BadgeTone;
};

export type MaintenancePriorityOption = {
  code: MaintenancePriority;
  label: string;
  tone: BadgeTone;
};

export const MAINTENANCE_STATUSES: MaintenanceStatusOption[] = [
  { code: "OPEN", label: "Ouvert", tone: "warning" },
  { code: "IN_PROGRESS", label: "En cours", tone: "info" },
  { code: "WAITING", label: "En attente", tone: "neutral" },
  { code: "RESOLVED", label: "Résolu", tone: "success" },
  { code: "CLOSED", label: "Clôturé", tone: "accent" },
];

export const MAINTENANCE_PRIORITIES: MaintenancePriorityOption[] = [
  { code: "LOW", label: "Basse", tone: "neutral" },
  { code: "NORMAL", label: "Normale", tone: "info" },
  { code: "HIGH", label: "Haute", tone: "warning" },
  { code: "URGENT", label: "Urgente", tone: "danger" },
];

export const MAINTENANCE_STATUS_CODES = MAINTENANCE_STATUSES.map(
  (status) => status.code,
);

export const MAINTENANCE_PRIORITY_CODES = MAINTENANCE_PRIORITIES.map(
  (priority) => priority.code,
);

const CLOSED_STATUSES: MaintenanceStatus[] = ["RESOLVED", "CLOSED"];

export function isClosedStatus(status: string): boolean {
  return CLOSED_STATUSES.includes(status as MaintenanceStatus);
}

export function isOpenStatus(status: string): boolean {
  return !isClosedStatus(status);
}

export function maintenanceStatusLabel(code: string): string {
  return (
    MAINTENANCE_STATUSES.find((status) => status.code === code)?.label ?? code
  );
}

export function maintenanceStatusTone(code: string): BadgeTone {
  return (
    MAINTENANCE_STATUSES.find((status) => status.code === code)?.tone ??
    "neutral"
  );
}

export function maintenancePriorityLabel(code: string): string {
  return (
    MAINTENANCE_PRIORITIES.find((priority) => priority.code === code)?.label ??
    code
  );
}

export function maintenancePriorityTone(code: string): BadgeTone {
  return (
    MAINTENANCE_PRIORITIES.find((priority) => priority.code === code)?.tone ??
    "neutral"
  );
}
