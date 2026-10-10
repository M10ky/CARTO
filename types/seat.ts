/**
 * Représentation d'un poste telle qu'elle transite jusqu'au front.
 *
 * Ce type est volontairement indépendant de toute librairie d'accès aux
 * données : le mapping depuis Supabase sera écrit en Phase 5, une fois le
 * schéma relationnel validé.
 */

export type SeatKind = "PERSON" | "SPACE";

/**
 * États fonctionnels d'une position.
 * La correspondance visuelle (couleur + icône + libellé) est définie dans
 * `app/globals.css` — jamais la couleur seule ne porte l'information.
 * Les valeurs réelles seront paramétrées en base (table `seat_statuses`).
 */
export type SeatStatus =
  | "OCCUPIED"
  | "FREE"
  | "UNAVAILABLE"
  | "DAMAGED"
  | "MOVE_PLANNED"
  | "TO_VERIFY";

export type SeatDTO = {
  /** Identifiant stable, persisté en base. */
  id: string;
  /** Code lisible, ex. `AN-Z1-R1-003`. */
  code: string;
  kind: SeatKind;
  status: SeatStatus;
  wingName: string;
  zoneCode: string;
  zoneName: string;
  rowLabel: string;
  department: string | null;
  employeeName: string | null;
  employeeRole: string | null;
  pcHostname: string | null;
};
