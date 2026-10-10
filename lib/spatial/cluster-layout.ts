import type { WingType } from "./zone-definitions";

export type PlanSeatRow = {
  zone: string;
  excelRow: number;
  columns: string[];
};

export type PlanSpecialKind = "STAIR" | "PANTRY" | "DIRECTION" | "OPEN";

export type PlanSpecialArea = {
  id: string;
  label: string;
  kind: PlanSpecialKind;
  row: number;
  col: string;
  rowSpan: number;
  colSpan: number;
};

export type PlanLabel = {
  row: number;
  col: string;
  text: string;
  kind: "ZONE" | "RANGEE" | "WING";
};

export const PLAN_BOUNDS = { top: 10, bottom: 85, left: "C", right: "AS" };

export const PLAN_GRID = { rowHeight: 1, columnWidth: 1 };

export const SEAT_ROWS: PlanSeatRow[] = [
  { zone: "AN-Z4A", excelRow: 13, columns: ["E", "F", "G", "H", "I", "J"] },
  { zone: "AN-Z4A", excelRow: 15, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"] },
  { zone: "AN-Z4A", excelRow: 16, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"] },
  { zone: "AN-Z4A", excelRow: 18, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"] },
  { zone: "AN-Z4A", excelRow: 19, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"] },
  { zone: "AN-Z4A", excelRow: 21, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"] },
  { zone: "AN-Z4A", excelRow: 22, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"] },
  { zone: "AN-FORMATION", excelRow: 25, columns: ["C", "D", "E", "F", "G", "J"] },
  { zone: "AN-FORMATION", excelRow: 26, columns: ["D", "E", "F", "G", "J"] },
  { zone: "AN-Z3", excelRow: 31, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L"] },
  { zone: "AN-Z3", excelRow: 32, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L"] },
  { zone: "AN-Z3", excelRow: 34, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L"] },
  { zone: "AN-Z3", excelRow: 35, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L"] },
  { zone: "AN-Z3", excelRow: 37, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L"] },
  { zone: "AN-Z3", excelRow: 38, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L"] },
  { zone: "C-BOX3", excelRow: 44, columns: ["D"] },
  { zone: "AN-Z2", excelRow: 51, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L"] },
  { zone: "AN-Z2", excelRow: 52, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L"] },
  { zone: "AN-Z2", excelRow: 54, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L"] },
  { zone: "AN-Z2", excelRow: 55, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L"] },
  { zone: "AN-Z2", excelRow: 57, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L"] },
  { zone: "AN-Z2", excelRow: 58, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L"] },
  { zone: "AN-Z2", excelRow: 60, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L"] },
  { zone: "AN-Z2", excelRow: 61, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L"] },
  { zone: "AN-Z1", excelRow: 64, columns: ["D", "E", "F"] },
  { zone: "AN-Z1", excelRow: 67, columns: ["E", "F", "G", "H", "I", "J", "K", "L", "M"] },
  { zone: "AN-Z1", excelRow: 68, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"] },
  { zone: "AN-Z1", excelRow: 70, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"] },
  { zone: "AN-Z1", excelRow: 71, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"] },
  { zone: "AN-Z1", excelRow: 73, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"] },
  { zone: "AN-Z1", excelRow: 74, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"] },
  { zone: "AN-Z1", excelRow: 76, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"] },
  { zone: "AN-Z1", excelRow: 77, columns: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"] },
  { zone: "AN-Z1", excelRow: 79, columns: ["F", "G", "H", "I", "J", "K"] },
  { zone: "AN-Z4B", excelRow: 13, columns: ["Q", "R", "S", "T", "U", "V"] },
  { zone: "AN-Z4B", excelRow: 15, columns: ["Q", "R", "S", "T", "U", "V"] },
  { zone: "AN-Z4B", excelRow: 16, columns: ["Q", "R", "S", "T", "U", "V"] },
  { zone: "AN-Z9", excelRow: 25, columns: ["P", "R", "S", "U", "V"] },
  { zone: "AN-Z9", excelRow: 26, columns: ["R", "S", "U", "V"] },
  { zone: "AN-Z9", excelRow: 27, columns: ["P", "R", "S", "U", "V"] },
  { zone: "AN-Z9", excelRow: 28, columns: ["P", "R", "S", "U", "V"] },
  { zone: "AN-Z9", excelRow: 29, columns: ["P", "R", "S", "U", "V"] },
  { zone: "AN-Z9", excelRow: 30, columns: ["P", "R", "S", "U", "V"] },
  { zone: "AN-Z9", excelRow: 31, columns: ["R", "S", "U", "V"] },
  { zone: "AN-Z9", excelRow: 32, columns: ["R", "S", "U", "V"] },
  { zone: "AN-Z9", excelRow: 33, columns: ["R", "S", "U", "V"] },
  { zone: "AN-Z8", excelRow: 13, columns: ["AA", "AB", "AC", "AD", "AE", "AF"] },
  { zone: "AN-Z8", excelRow: 15, columns: ["AA", "AB", "AC", "AD", "AE", "AF"] },
  { zone: "AN-Z8", excelRow: 16, columns: ["AA", "AB", "AC", "AD", "AE", "AF"] },
  { zone: "AN-Z8", excelRow: 18, columns: ["AA", "AB", "AC", "AD", "AE", "AF"] },
  { zone: "AN-Z8", excelRow: 19, columns: ["AA", "AB", "AC", "AD", "AE", "AF"] },
  { zone: "AN-CENTRAL", excelRow: 25, columns: ["AA", "AB", "AD", "AE"] },
  { zone: "AN-CENTRAL", excelRow: 26, columns: ["AA", "AB", "AD", "AE"] },
  { zone: "AN-CENTRAL", excelRow: 27, columns: ["AA", "AB", "AD", "AE"] },
  { zone: "AN-CENTRAL", excelRow: 28, columns: ["AA", "AB", "AD", "AE"] },
  { zone: "AN-CENTRAL", excelRow: 29, columns: ["AA", "AB", "AD", "AE"] },
  { zone: "AN-CENTRAL", excelRow: 30, columns: ["AA", "AB", "AD", "AE"] },
  { zone: "AN-CENTRAL", excelRow: 31, columns: ["AA", "AB", "AD", "AE"] },
  { zone: "AN-CENTRAL", excelRow: 32, columns: ["AA", "AB", "AD", "AE"] },
  { zone: "AN-CENTRAL", excelRow: 33, columns: ["AA", "AB", "AD", "AE"] },
  { zone: "AS-Z4", excelRow: 13, columns: ["AL", "AM", "AN", "AO", "AP", "AQ"] },
  { zone: "AS-Z4", excelRow: 15, columns: ["AJ", "AK", "AL", "AM", "AN", "AO", "AP", "AQ", "AR", "AS"] },
  { zone: "AS-Z4", excelRow: 16, columns: ["AJ", "AK", "AL", "AM", "AN", "AO", "AP", "AQ", "AR", "AS"] },
  { zone: "AS-Z4", excelRow: 18, columns: ["AJ", "AK", "AL", "AM", "AN", "AO", "AP", "AQ", "AR", "AS"] },
  { zone: "AS-Z4", excelRow: 19, columns: ["AJ", "AK", "AL", "AM", "AN", "AO", "AP", "AQ", "AR", "AS"] },
  { zone: "AS-Z4", excelRow: 21, columns: ["AM", "AN", "AO", "AP", "AQ", "AR"] },
  { zone: "AS-Z4", excelRow: 22, columns: ["AM", "AN", "AO", "AP", "AQ", "AR"] },
  { zone: "AS-Z7", excelRow: 28, columns: ["AJ", "AK", "AL", "AM", "AN", "AO", "AP", "AQ", "AR"] },
  { zone: "AS-Z7", excelRow: 29, columns: ["AJ", "AK", "AL", "AM", "AN", "AO", "AP", "AQ", "AR"] },
  { zone: "AS-Z7", excelRow: 31, columns: ["AJ", "AK", "AL", "AM", "AN", "AO", "AP", "AQ", "AR"] },
  { zone: "AS-Z7", excelRow: 32, columns: ["AJ", "AK", "AL", "AM", "AN", "AO", "AP", "AQ", "AR"] },
  { zone: "AS-Z7", excelRow: 34, columns: ["AJ", "AK", "AL", "AM", "AN", "AO", "AP", "AQ", "AR"] },
  { zone: "AS-Z7", excelRow: 35, columns: ["AJ", "AK", "AL", "AM", "AN", "AO", "AP", "AQ", "AR"] },
  { zone: "AS-Z7", excelRow: 37, columns: ["AJ", "AK", "AL", "AM", "AN", "AO", "AP", "AQ", "AR"] },
  { zone: "AS-Z7", excelRow: 38, columns: ["AJ", "AK", "AL", "AM", "AN", "AO", "AP", "AQ", "AR"] },
  { zone: "AS-Z6", excelRow: 44, columns: ["AJ", "AK", "AL", "AM", "AN", "AO", "AP", "AQ", "AR"] },
  { zone: "AS-Z6", excelRow: 45, columns: ["AJ", "AK", "AL", "AM", "AN", "AO", "AP", "AQ", "AR"] },
  { zone: "AS-Z6", excelRow: 47, columns: ["AJ", "AK", "AL", "AM", "AN", "AO", "AP", "AQ", "AR"] },
  { zone: "AS-Z6", excelRow: 48, columns: ["AJ", "AK", "AL", "AM", "AN", "AO", "AP", "AQ", "AR"] },
  { zone: "AS-Z6", excelRow: 50, columns: ["AJ", "AK", "AL", "AM", "AN", "AO", "AP", "AQ", "AR"] },
  { zone: "AS-Z6", excelRow: 51, columns: ["AJ", "AK", "AL", "AM", "AN", "AO", "AP", "AQ", "AR"] },
  { zone: "AS-Z6", excelRow: 53, columns: ["AJ", "AK", "AL", "AM", "AN", "AO", "AP", "AQ", "AR"] },
  { zone: "AS-Z6", excelRow: 54, columns: ["AJ", "AK", "AL", "AM", "AN", "AO", "AP", "AQ", "AR"] },
  { zone: "C-BOX4", excelRow: 60, columns: ["AJ", "AM", "AP"] },
  { zone: "AS-Z5", excelRow: 67, columns: ["AK", "AL", "AM", "AN", "AO", "AP"] },
  { zone: "AS-Z5", excelRow: 68, columns: ["AK", "AL", "AM", "AN", "AO", "AP"] },
  { zone: "AS-Z5", excelRow: 70, columns: ["AK", "AL", "AM", "AN", "AO", "AP"] },
  { zone: "AS-Z5", excelRow: 71, columns: ["AK", "AL", "AM", "AN", "AO", "AP"] },
  { zone: "AS-Z5", excelRow: 73, columns: ["AK", "AL", "AM", "AN", "AO", "AP"] },
  { zone: "AS-Z5", excelRow: 74, columns: ["AK", "AL", "AM", "AN", "AO", "AP"] },
  { zone: "AS-Z5", excelRow: 76, columns: ["AK", "AL", "AM", "AN", "AO", "AP"] },
  { zone: "AS-Z5", excelRow: 77, columns: ["AK", "AL", "AM", "AN", "AO", "AP"] },
  { zone: "C-BOX5", excelRow: 83, columns: ["AJ"] },
];

export const SPECIAL_AREAS: PlanSpecialArea[] = [
  { id: "ESCALIER EST", label: "ESCALIER EST", kind: "STAIR", row: 10, col: "X", rowSpan: 11, colSpan: 1 },
  { id: "PANTRY", label: "Pantry", kind: "PANTRY", row: 39, col: "P", rowSpan: 3, colSpan: 17 },
  { id: "VOID-P45", label: "Espace vide", kind: "OPEN", row: 45, col: "P", rowSpan: 12, colSpan: 6 },
  { id: "VOID-W45", label: "Espace vide", kind: "OPEN", row: 45, col: "W", rowSpan: 12, colSpan: 4 },
  { id: "VOID-AB45", label: "Espace vide", kind: "OPEN", row: 45, col: "AB", rowSpan: 12, colSpan: 4 },
  { id: "VOID-Z61", label: "Espace vide", kind: "OPEN", row: 61, col: "Z", rowSpan: 11, colSpan: 6 },
  { id: "VOID-Q64", label: "Espace vide", kind: "OPEN", row: 64, col: "Q", rowSpan: 2, colSpan: 7 },
  { id: "VOID-Q71", label: "Espace vide", kind: "OPEN", row: 71, col: "Q", rowSpan: 2, colSpan: 3 },
  { id: "VOID-U71", label: "Espace vide", kind: "OPEN", row: 71, col: "U", rowSpan: 2, colSpan: 3 },
  { id: "VOID-AB73", label: "Espace vide", kind: "OPEN", row: 73, col: "AB", rowSpan: 10, colSpan: 4 },
  { id: "VOID-Q74", label: "Espace vide", kind: "OPEN", row: 74, col: "Q", rowSpan: 2, colSpan: 3 },
  { id: "VOID-U74", label: "Espace vide", kind: "OPEN", row: 74, col: "U", rowSpan: 2, colSpan: 3 },
  { id: "VOID-R80", label: "Espace vide", kind: "OPEN", row: 80, col: "R", rowSpan: 2, colSpan: 5 },
  { id: "VOID-X80", label: "Espace vide", kind: "OPEN", row: 80, col: "X", rowSpan: 2, colSpan: 3 },
];

export const PLAN_LABELS: PlanLabel[] = [
  { row: 8, col: "C", text: "AILE NORD", kind: "WING" },
  { row: 8, col: "AK", text: "AILE SUD", kind: "WING" },
  { row: 11, col: "C", text: "ZONE 4", kind: "ZONE" },
  { row: 11, col: "P", text: "ZONE 4", kind: "ZONE" },
  { row: 11, col: "Z", text: "ZONE 8", kind: "ZONE" },
  { row: 11, col: "AI", text: "ZONE 4", kind: "ZONE" },
  { row: 13, col: "C", text: "Rangée 4", kind: "RANGEE" },
  { row: 13, col: "P", text: "Rangée 5", kind: "RANGEE" },
  { row: 13, col: "Z", text: "Rangée 4", kind: "RANGEE" },
  { row: 13, col: "AI", text: "Rangée 3", kind: "RANGEE" },
  { row: 15, col: "C", text: "Rangée 3", kind: "RANGEE" },
  { row: 15, col: "P", text: "Rangée 6", kind: "RANGEE" },
  { row: 15, col: "Z", text: "Rangée 5", kind: "RANGEE" },
  { row: 15, col: "AI", text: "Rangée 2", kind: "RANGEE" },
  { row: 18, col: "C", text: "Rangée 2", kind: "RANGEE" },
  { row: 18, col: "Z", text: "Rangée 6", kind: "RANGEE" },
  { row: 18, col: "AI", text: "Rangée 1", kind: "RANGEE" },
  { row: 21, col: "C", text: "Rangée 1", kind: "RANGEE" },
  { row: 21, col: "AI", text: "Rangée 4 (Nouvelles positions)", kind: "RANGEE" },
  { row: 23, col: "P", text: "ZONE 9", kind: "ZONE" },
  { row: 26, col: "AI", text: "ZONE 7", kind: "ZONE" },
  { row: 28, col: "AI", text: "Rangée 4", kind: "RANGEE" },
  { row: 29, col: "C", text: "ZONE 3", kind: "ZONE" },
  { row: 31, col: "C", text: "Rangée 3", kind: "RANGEE" },
  { row: 31, col: "AI", text: "Rangée 3", kind: "RANGEE" },
  { row: 34, col: "C", text: "Rangée 2", kind: "RANGEE" },
  { row: 34, col: "P", text: "Rangée 1", kind: "RANGEE" },
  { row: 34, col: "R", text: "Rangée 2", kind: "RANGEE" },
  { row: 34, col: "U", text: "Rangée 3", kind: "RANGEE" },
  { row: 34, col: "X", text: "Rangée 4", kind: "RANGEE" },
  { row: 34, col: "AA", text: "Rangée 5", kind: "RANGEE" },
  { row: 34, col: "AD", text: "Rangée 6", kind: "RANGEE" },
  { row: 34, col: "AI", text: "Rangée 2", kind: "RANGEE" },
  { row: 37, col: "C", text: "Rangée 1", kind: "RANGEE" },
  { row: 37, col: "AI", text: "Rangée 1", kind: "RANGEE" },
  { row: 42, col: "C", text: "BOX 3", kind: "ZONE" },
  { row: 42, col: "AI", text: "ZONE 6", kind: "ZONE" },
  { row: 44, col: "AI", text: "Rangée 4", kind: "RANGEE" },
  { row: 47, col: "AI", text: "Rangée 3", kind: "RANGEE" },
  { row: 49, col: "C", text: "ZONE 2", kind: "ZONE" },
  { row: 50, col: "AI", text: "Rangée 2", kind: "RANGEE" },
  { row: 51, col: "C", text: "Rangée 4", kind: "RANGEE" },
  { row: 53, col: "AI", text: "Rangée 1", kind: "RANGEE" },
  { row: 54, col: "C", text: "Rangée 3", kind: "RANGEE" },
  { row: 57, col: "C", text: "Rangée 2", kind: "RANGEE" },
  { row: 58, col: "AI", text: "BOX 4", kind: "ZONE" },
  { row: 60, col: "C", text: "Rangée 1", kind: "RANGEE" },
  { row: 65, col: "C", text: "ZONE 1", kind: "ZONE" },
  { row: 65, col: "AI", text: "ZONE 5", kind: "ZONE" },
  { row: 67, col: "C", text: "Rangée 5", kind: "RANGEE" },
  { row: 67, col: "AJ", text: "Rangée 4", kind: "RANGEE" },
  { row: 70, col: "C", text: "Rangée 4", kind: "RANGEE" },
  { row: 70, col: "AJ", text: "Rangée 3", kind: "RANGEE" },
  { row: 73, col: "C", text: "Rangée 3", kind: "RANGEE" },
  { row: 73, col: "AJ", text: "Rangée 2", kind: "RANGEE" },
  { row: 76, col: "C", text: "Rangée 2", kind: "RANGEE" },
  { row: 76, col: "AJ", text: "Rangée 1", kind: "RANGEE" },
  { row: 79, col: "C", text: "Rangée 1", kind: "RANGEE" },
  { row: 81, col: "AI", text: "BOX 5", kind: "ZONE" },
];

export function columnsToNumbers(columns: string[]): number[] {
  return columns.map((name) => {
    let value = 0;
    for (const char of name) value = value * 26 + (char.charCodeAt(0) - 64);
    return value;
  });
}

export function countSeats(rows: PlanSeatRow[] = SEAT_ROWS): number {
  return rows.reduce((total, row) => total + row.columns.length, 0);
}

export function drawnSeatsByZone(rows: PlanSeatRow[] = SEAT_ROWS): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const row of rows) {
    totals[row.zone] = (totals[row.zone] ?? 0) + row.columns.length;
  }
  return totals;
}

export const DECLARED_POSITIONS: Record<string, number | null> = {
  "AN-Z4A": 60,
  "AN-FORMATION": null,
  "AN-Z3": 48,
  "C-BOX3": 1,
  "AN-Z2": 64,
  "AN-Z1": 77,
  "AN-Z4B": 18,
  "AN-Z9": 90,
  "AN-Z8": 30,
  "AN-CENTRAL": null,
  "AS-Z4": 46,
  "AS-Z7": 72,
  "AS-Z6": 72,
  "C-BOX4": 3,
  "AS-Z5": 48,
  "C-BOX5": 1,
};

export const ZONE_LABELS: Record<string, string> = {
  "AN-Z4A": "Zone 4 — YAS AS / Télésales",
  "AN-FORMATION": "Formation",
  "AN-Z3": "Zone 3 — MVOLA AE",
  "C-BOX3": "Box 3 — Direction",
  "AN-Z2": "Zone 2 — Grands Comptes / PMI-PME",
  "AN-Z1": "Zone 1 — B4B",
  "AN-Z4B": "Zone 4 — Certifications",
  "AN-Z9": "Zone 9 — Réclamations / Accueil MVOLA",
  "AN-Z8": "Zone 8 — Opérateurs",
  "AN-CENTRAL": "Bloc central (géométrie à confirmer)",
  "AS-Z4": "Zone 4 — Comores / Telco OIF / VFM",
  "AS-Z7": "Zone 7 — YAS AE / Digital",
  "AS-Z6": "Zone 6 — Activation / Facturation YAS / Tersea",
  "C-BOX4": "Box 4 — Direction",
  "AS-Z5": "Zone 5 — Support / IT / Consulting / Finances",
  "C-BOX5": "Box 5 — Direction",
};

export const WING_OF_ZONE: Record<string, WingType> = {
  "AN-CENTRAL": "AILE_NORD",
  "AN-FORMATION": "AILE_NORD",
  "AN-Z1": "AILE_NORD",
  "AN-Z2": "AILE_NORD",
  "AN-Z3": "AILE_NORD",
  "AN-Z4A": "AILE_NORD",
  "AN-Z4B": "AILE_NORD",
  "AN-Z8": "AILE_NORD",
  "AN-Z9": "AILE_NORD",
  "AS-Z4": "AILE_SUD",
  "AS-Z5": "AILE_SUD",
  "AS-Z6": "AILE_SUD",
  "AS-Z7": "AILE_SUD",
  "C-BOX3": "CENTRAL",
  "C-BOX4": "CENTRAL",
  "C-BOX5": "CENTRAL",
};
