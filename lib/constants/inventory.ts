import type { BadgeTone } from "@/components/ui/badge";

export type PcStatusOption = {
  code: string;
  label: string;
  tone: BadgeTone;
};

export const PC_STATUSES: PcStatusOption[] = [
  { code: "UNKNOWN", label: "Inconnu", tone: "neutral" },
  { code: "IN_USE", label: "En service", tone: "success" },
  { code: "IN_STOCK", label: "En stock", tone: "info" },
  { code: "MAINTENANCE", label: "En maintenance", tone: "warning" },
  { code: "RETIRED", label: "Réformé", tone: "danger" },
];

export const PC_ASSET_TYPES: string[] = [
  "DESKTOP",
  "LAPTOP",
  "MONITOR",
  "PRINTER",
  "OTHER",
];

export function pcStatusLabel(code: string): string {
  return PC_STATUSES.find((status) => status.code === code)?.label ?? code;
}

export function pcStatusTone(code: string): BadgeTone {
  return PC_STATUSES.find((status) => status.code === code)?.tone ?? "neutral";
}
