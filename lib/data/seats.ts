import { createClient } from "@/lib/supabase/server";

export type SeatOption = {
  id: string;
  code: string;
  label: string | null;
  zoneName: string | null;
};

export async function listSeatOptions(): Promise<SeatOption[]> {
  const supabase = await createClient();
  const [seatResult, zoneResult] = await Promise.all([
    supabase
      .from("seats")
      .select("id, code, label, zone_id")
      .eq("is_active", true)
      .order("code")
      .limit(2000),
    supabase.from("zones").select("id, name"),
  ]);

  const error = seatResult.error ?? zoneResult.error;
  if (error) {
    throw new Error(`Lecture des positions impossible : ${error.message}`);
  }

  const zoneNameById = new Map(
    ((zoneResult.data ?? []) as { id: string; name: string }[]).map((zone) => [
      zone.id,
      zone.name,
    ]),
  );

  return (
    (seatResult.data ?? []) as {
      id: string;
      code: string;
      label: string | null;
      zone_id: string;
    }[]
  ).map((seat) => ({
    id: seat.id,
    code: seat.code,
    label: seat.label,
    zoneName: zoneNameById.get(seat.zone_id) ?? null,
  }));
}

export type SeatStatusOption = {
  code: string;
  label: string;
};

export async function listSeatStatuses(): Promise<SeatStatusOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seat_statuses")
    .select("code, label")
    .order("sort_order");

  if (error) {
    throw new Error(`Lecture des statuts de position impossible : ${error.message}`);
  }
  return (
    (data ?? []) as { code: string; label: string }[]
  ).map((row) => ({ code: row.code, label: row.label }));
}