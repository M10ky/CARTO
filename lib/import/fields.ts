import type { ImportFieldSpec, ImportKind } from "@/lib/import/types";

export function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export const IMPORT_KINDS: ImportKind[] = ["employees", "assets"];

export function isImportKind(value: unknown): value is ImportKind {
  return value === "employees" || value === "assets";
}

export function importKindLabel(kind: ImportKind): string {
  return kind === "employees" ? "Collaborateurs" : "Parc informatique";
}

const EMPLOYEE_FIELDS: ImportFieldSpec[] = [
  {
    field: "matricule",
    label: "Matricule",
    aliases: [
      "matricule",
      "matriculeid",
      "id",
      "identifiant",
      "numeromatricule",
      "codeemploye",
      "code",
    ],
  },
  {
    field: "firstName",
    label: "Prénom",
    aliases: ["prenom", "prenoms", "firstname", "givenname"],
  },
  {
    field: "lastName",
    label: "Nom",
    aliases: ["nom", "nomdefamille", "lastname", "surname", "name"],
  },
  {
    field: "service",
    label: "Service",
    aliases: [
      "service",
      "services",
      "departement",
      "direction",
      "pole",
      "entite",
      "equipe",
    ],
  },
  {
    field: "jobTitle",
    label: "Fonction",
    aliases: [
      "fonction",
      "poste",
      "metier",
      "intitule",
      "intituleposte",
      "jobtitle",
    ],
  },
  {
    field: "email",
    label: "E-mail",
    aliases: [
      "email",
      "mail",
      "adressemail",
      "courriel",
      "adresseelectronique",
      "emailprofessionnel",
    ],
    type: "email",
  },
  {
    field: "phone",
    label: "Téléphone",
    aliases: ["telephone", "tel", "phone", "mobile", "numerotelephone"],
  },
  {
    field: "location",
    label: "Localisation",
    aliases: [
      "localisation",
      "emplacement",
      "site",
      "bureau",
      "aile",
      "zone",
      "batiment",
      "etage",
    ],
  },
];

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

export const IMPORT_FIELDS: Record<ImportKind, ImportFieldSpec[]> = {
  employees: EMPLOYEE_FIELDS,
  assets: ASSET_FIELDS,
};

export const TEMPLATE_HEADERS: Record<ImportKind, string[]> = {
  employees: [
    "Matricule",
    "Prénom",
    "Nom",
    "Service",
    "Fonction",
    "E-mail",
    "Téléphone",
    "Localisation",
  ],
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
