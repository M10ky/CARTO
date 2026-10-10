export type WingType = "CENTRAL" | "AILE_NORD" | "AILE_SUD";

export type ZoneKind = "OPEN_SPACE" | "BOX";

export type ZoneDefinition = {
  /** Code stable, format `{AILE}-Z{n}` — référence `Mapping.html` (`AN_Z1_R1`). */
  code: string;
  wing: WingType;
  name: string;
  kind: ZoneKind;
  department: string | null;
  /** Nombre de rangées déclaré par la source prototype. */
  rows: number;
  /**
   * Nombre de positions déclaré par le prototype (`cartographie-cluster.html`).
   * Valeur provisoire : la géométrie réelle sera extraite du .xlsx en Phase 3.
   */
  totalPrototype: number;
  /**
   * Nombre de positions annoncé par les compteurs d'en-tête du fichier Excel
   * `Feuille de calcul sans titre.xlsx`.
   * Écarts connus avec `totalPrototype` : Zone 1 (77 vs 78).
   */
  totalExcel: number;
};

export const WINGS: { type: WingType; name: string; order: number }[] = [
  { type: "CENTRAL", name: "Central", order: 0 },
  { type: "AILE_NORD", name: "Aile Nord", order: 1 },
  { type: "AILE_SUD", name: "Aile Sud", order: 2 },
];

export const ZONE_DEFINITIONS: ZoneDefinition[] = [
  // ---- Central (boxes de direction) ----
  {
    code: "C-BOX5",
    wing: "CENTRAL",
    name: "Box 5 — Direction",
    kind: "BOX",
    department: "Direction",
    rows: 1,
    totalPrototype: 1,
    totalExcel: 1,
  },
  {
    code: "C-BOX4",
    wing: "CENTRAL",
    name: "Box 4 — Direction",
    kind: "BOX",
    department: "Direction",
    rows: 1,
    totalPrototype: 3,
    totalExcel: 3,
  },
  {
    code: "C-BOX3",
    wing: "CENTRAL",
    name: "Box 3 — Direction",
    kind: "BOX",
    department: "Direction",
    rows: 1,
    totalPrototype: 1,
    totalExcel: 1,
  },

  // ---- Aile Nord ----
  {
    code: "AN-Z1",
    wing: "AILE_NORD",
    name: "Zone 1 — B4B",
    kind: "OPEN_SPACE",
    department: "B4B",
    rows: 5,
    totalPrototype: 78,
    totalExcel: 77,
  },
  {
    code: "AN-Z2",
    wing: "AILE_NORD",
    name: "Zone 2 — Grands Comptes / PMI-PME",
    kind: "OPEN_SPACE",
    department: "Commercial",
    rows: 4,
    totalPrototype: 64,
    totalExcel: 64,
  },
  {
    code: "AN-Z3",
    wing: "AILE_NORD",
    name: "Zone 3 — MVOLA AE",
    kind: "OPEN_SPACE",
    department: "Mvola",
    rows: 3,
    totalPrototype: 48,
    totalExcel: 48,
  },
  {
    code: "AN-Z4A",
    wing: "AILE_NORD",
    name: "Zone 4 — YAS AS / Télésales",
    kind: "OPEN_SPACE",
    department: "Yas",
    rows: 4,
    totalPrototype: 60,
    totalExcel: 60,
  },
  {
    code: "AN-Z4B",
    wing: "AILE_NORD",
    name: "Zone 4 — Certifications",
    kind: "OPEN_SPACE",
    department: "Certification",
    rows: 2,
    totalPrototype: 18,
    totalExcel: 18,
  },
  {
    code: "AN-Z9",
    wing: "AILE_NORD",
    name: "Zone 9 — Réclamations / Accueil MVOLA",
    kind: "OPEN_SPACE",
    department: "Mvola",
    rows: 5,
    totalPrototype: 90,
    totalExcel: 90,
  },
  {
    code: "AN-Z8",
    wing: "AILE_NORD",
    name: "Zone 8 — Opérateurs (Incom / Stellarix / Prodigy)",
    kind: "OPEN_SPACE",
    department: "Opérateurs",
    rows: 3,
    totalPrototype: 30,
    totalExcel: 30,
  },

  // ---- Aile Sud ----
  {
    code: "AS-Z5",
    wing: "AILE_SUD",
    name: "Zone 5 — Support / IT / Consulting / Finances",
    kind: "OPEN_SPACE",
    department: "Support",
    rows: 4,
    totalPrototype: 48,
    totalExcel: 48,
  },
  {
    code: "AS-Z6",
    wing: "AILE_SUD",
    name: "Zone 6 — Activation / Facturation YAS / Tersea",
    kind: "OPEN_SPACE",
    department: "Yas",
    rows: 4,
    totalPrototype: 72,
    totalExcel: 72,
  },
  {
    code: "AS-Z7",
    wing: "AILE_SUD",
    name: "Zone 7 — YAS AE / Digital",
    kind: "OPEN_SPACE",
    department: "Yas",
    rows: 4,
    totalPrototype: 72,
    totalExcel: 72,
  },
  {
    code: "AS-ZOP",
    wing: "AILE_SUD",
    name: "Zone — Opérateurs (Free / Incom / Stellarix / Prodigy)",
    kind: "OPEN_SPACE",
    department: "Opérateurs",
    rows: 3,
    totalPrototype: 30,
    totalExcel: 30,
  },
  {
    code: "AS-Z4",
    wing: "AILE_SUD",
    name: "Zone 4 — Comores / Telco OIF / VFM",
    kind: "OPEN_SPACE",
    department: "Opérateurs",
    rows: 4,
    totalPrototype: 46,
    totalExcel: 46,
  },
];

export function getZoneByCode(code: string): ZoneDefinition | undefined {
  return ZONE_DEFINITIONS.find((zone) => zone.code === code);
}
