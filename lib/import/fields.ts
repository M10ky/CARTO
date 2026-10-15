import type { ImportFieldSpec, ImportKind } from "@/lib/import/types";

export function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export const IMPORT_KINDS: ImportKind[] = ["assets", "seats"];

export function isImportKind(value: unknown): value is ImportKind {
  return value === "assets" || value === "seats";
}

export function importKindLabel(kind: ImportKind): string {
  return kind === "assets" ? "Parc informatique" : "Positions (plan)";
}

const ASSET_FIELDS: ImportFieldSpec[] = [
  {
    field: "assetTag",
    label: "N° d'inventaire",
    aliases: [
      "inventaire",
      "numerodinventaire",
      "numinventaire",
      "numerodeinventaire",
      "assettag",
      "etiquette",
      "tag",
      "codeinventaire",
      "numinvent",
    ],
  },
  {
    field: "serialNumber",
    label: "N° de série",
    aliases: [
      "numerodeserie",
      "numeroserie",
      "nserie",
      "serial",
      "serialnumber",
      "sn",
      "numeroserial",
    ],
  },
  {
    field: "manufacturer",
    label: "Fabricant",
    aliases: ["fabricant", "marque", "manufacturer", "constructeur"],
  },
  {
    field: "model",
    label: "Modèle",
    aliases: ["modele", "model", "reference", "referentiemodel"],
  },
  {
    field: "assetType",
    label: "Type",
    aliases: [
      "type",
      "typeequipement",
      "typedemateriel",
      "categorie",
      "assettype",
      "materiel",
    ],
  },
  {
    field: "os",
    label: "Système d'exploitation",
    aliases: [
      "systemeexploitation",
      "systemedexploitation",
      "os",
      "systeme",
      "operatingsystem",
    ],
  },
  {
    field: "status",
    label: "Statut",
    aliases: ["statut", "status", "etat", "state", "situation"],
  },
  {
    field: "notes",
    label: "Notes",
    aliases: [
      "notes",
      "note",
      "observation",
      "observations",
      "commentaire",
      "commentaires",
      "remarque",
      "remarques",
      "utilisateur",
      "login",
      "affectation",
    ],
  },
];

const SEAT_FIELDS: ImportFieldSpec[] = [
  {
    field: "code",
    label: "Code de la position",
    aliases: [
      "code",
      "codeposition",
      "positioncode",
      "refposition",
      "identifiantposition",
      "referenceposition",
      "position",
      "poste",
    ],
  },
  {
    field: "label",
    label: "Indice",
    aliases: [
      "indice",
      "indiceposition",
      "libelle",
      "libelleposition",
      "label",
      "etiquettedeposte",
      "prefixe",
      "numeroposte",
    ],
  },
  {
    field: "zone",
    label: "Zone",
    aliases: [
      "zone",
      "codezone",
      "zoneparente",
      "secteur",
      "salle",
      "emplacement",
      "site",
    ],
  },
  {
    field: "row",
    label: "Rangée",
    aliases: ["rangee", "range", "rang", "ligne", "file", "rangdenrangee", "row"],
  },
  {
    field: "status",
    label: "Statut",
    aliases: [
      "statut",
      "status",
      "etat",
      "situation",
      "etatdelaposition",
      "occupation",
      "disponibilite",
    ],
  },
  {
    field: "gridRow",
    label: "Ligne Excel",
    aliases: [
      "ligneexcel",
      "numeroligne",
      "noligne",
      "excelrow",
      "gridrow",
      "rowindex",
      "lignefeuille",
    ],
  },
  {
    field: "gridCol",
    label: "Colonne Excel",
    aliases: [
      "colonneexcel",
      "numerocolonne",
      "excelcol",
      "gridcol",
      "colindex",
      "colonnefeuille",
    ],
  },
];

export const IMPORT_FIELDS: Record<ImportKind, ImportFieldSpec[]> = {
  assets: ASSET_FIELDS,
  seats: SEAT_FIELDS,
};

export const TEMPLATE_HEADERS: Record<ImportKind, string[]> = {
  assets: [
    "N° d'inventaire",
    "N° de série",
    "Fabricant",
    "Modèle",
    "Type",
    "Système d'exploitation",
    "Statut",
    "Notes",
  ],
  seats: [
    "Code de la position",
    "Indice",
    "Zone",
    "Rangée",
    "Statut",
    "Ligne Excel",
    "Colonne Excel",
  ],
};

const STATUS_ALIASES: [string[], string][] = [
  [
    [
      "actif",
      "active",
      "enservice",
      "utilise",
      "enutilisation",
      "affecte",
      "deploye",
      "operationnel",
    ],
    "IN_USE",
  ],
  [["enstock", "stock", "disponible", "libre", "nonaffecte"], "IN_STOCK"],
  [
    [
      "maintenance",
      "enmaintenance",
      "panne",
      "reparation",
      "enreparation",
      "sav",
      "endepannage",
    ],
    "MAINTENANCE",
  ],
  [
    ["reforme", "retired", "hs", "horsservice", "obsolete", "rebut"],
    "RETIRED",
  ],
  [["inconnu", "unknown", "na", "nonrenseigne"], "UNKNOWN"],
];

export function normalizeStatus(raw: string): string {
  const key = normalizeKey(raw);
  if (!key) {
    return "";
  }
  for (const [aliases, code] of STATUS_ALIASES) {
    if (aliases.includes(key)) {
      return code;
    }
  }
  return "";
}

const SEAT_STATUS_ALIASES: [string[], string][] = [
  [
    [
      "occupe",
      "occuper",
      "occupee",
      "occupie",
      "enutilisation",
      "utilise",
      "assigne",
      "affecte",
      "occupied",
    ],
    "OCCUPIED",
  ],
  [["libre", "disponible", "vide", "nonoccupe", "free", "available"], "FREE"],
  [
    [
      "indisponible",
      "horsservice",
      "enpanne",
      "reserver",
      "enreparation",
      "unavailable",
      "reserved",
    ],
    "UNAVAILABLE",
  ],
];

export function normalizeSeatStatus(raw: string): string {
  const trimmed = raw.trim();
  const key = normalizeKey(trimmed);
  if (!key) {
    return "";
  }
  for (const [aliases, code] of SEAT_STATUS_ALIASES) {
    if (aliases.includes(key)) {
      return code;
    }
  }
  return trimmed.toUpperCase();
}

const TYPE_ALIASES: [string[], string][] = [
  [
    [
      "desktop",
      "fixe",
      "unitecentrale",
      "pcfixe",
      "ordinateurfixe",
      "tour",
    ],
    "DESKTOP",
  ],
  [
    ["laptop", "portable", "pcportable", "ordinateurportable", "notebook"],
    "LAPTOP",
  ],
  [["monitor", "ecran", "moniteur"], "MONITOR"],
  [["printer", "imprimante", "scanner", "multifonction"], "PRINTER"],
];

export function normalizeAssetType(raw: string): string {
  const key = normalizeKey(raw);
  if (!key) {
    return "";
  }
  for (const [aliases, code] of TYPE_ALIASES) {
    if (aliases.includes(key)) {
      return code;
    }
  }
  return "OTHER";
}