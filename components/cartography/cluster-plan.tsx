"use client";

import type { PlanLayout } from "@/types/plan";

function columnToNumber(name: string): number {
  let value = 0;
  for (const char of name.toUpperCase()) {
    value = value * 26 + (char.charCodeAt(0) - 64);
  }
  return value;
}

function numberToColumn(value: number): string {
  let column = "";
  let current = value;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    current = Math.floor((current - 1) / 26);
  }
  return column;
}

const CELL_W = 26;
const CELL_H = 22;
const PAD = 14;

export type ClusterPlanProps = {
  layout: PlanLayout;
  selectedSeatId: string | null;
  onSelectSeat: (seatId: string) => void;
  moveMode?: boolean;
  onCellClick?: (gridRow: number, gridCol: string) => void;
};

export function ClusterPlan({
  layout,
  selectedSeatId,
  onSelectSeat,
  moveMode = false,
  onCellClick,
}: ClusterPlanProps) {
  const positioned = layout.seats.filter(
    (seat) => seat.gridRow !== null && seat.gridCol !== null,
  );

  let minRow = Number.POSITIVE_INFINITY;
  let maxRow = Number.NEGATIVE_INFINITY;
  let minCol = Number.POSITIVE_INFINITY;
  let maxCol = Number.NEGATIVE_INFINITY;

  function extend(gridRow: number, gridCol: string, rowSpan = 1, colSpan = 1) {
    const col = columnToNumber(gridCol);
    minRow = Math.min(minRow, gridRow);
    maxRow = Math.max(maxRow, gridRow + rowSpan - 1);
    minCol = Math.min(minCol, col);
    maxCol = Math.max(maxCol, col + colSpan - 1);
  }

  for (const seat of positioned) {
    extend(seat.gridRow as number, seat.gridCol as string);
  }
  for (const annotation of layout.annotations) {
    if (annotation.gridRow !== null && annotation.gridCol) {
      extend(
        annotation.gridRow,
        annotation.gridCol,
        annotation.rowSpan,
        annotation.colSpan,
      );
    }
  }

  if (!Number.isFinite(minRow)) {
    minRow = 10;
    maxRow = 85;
    minCol = columnToNumber("C");
    maxCol = columnToNumber("AS");
  }

  const TOP = minRow;
  const LEFT = minCol;
  const COLS = maxCol - minCol + 1;
  const ROWS = maxRow - minRow + 1;
  const WIDTH = COLS * CELL_W + PAD * 2;
  const HEIGHT = ROWS * CELL_H + PAD * 2;

  const xOf = (col: string) => PAD + (columnToNumber(col) - LEFT) * CELL_W;
  const yOf = (row: number) => PAD + (row - TOP) * CELL_H;

  const statusByCode = new Map(layout.statuses.map((s) => [s.code, s]));
  const zoneById = new Map(layout.zones.map((z) => [z.id, z]));

  return (
    <div className="overflow-auto rounded border border-line bg-ink-900/50">
      <svg
        role="img"
        aria-label="Plan physique du cluster, chaque rectangle représente une position"
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block"
      >
        <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-ink-950)" />

        {layout.annotations.map((annotation) => {
          if (annotation.gridRow === null || !annotation.gridCol) {
            return null;
          }
          const width = annotation.colSpan * CELL_W;
          const height = annotation.rowSpan * CELL_H;
          const x = xOf(annotation.gridCol);
          const y = yOf(annotation.gridRow);
          const isEmpty = annotation.label.toLowerCase().includes("vide");
          const isStair = annotation.label.toLowerCase().includes("escalier");

          if (annotation.kind === "WING") {
            return (
              <text
                key={annotation.id}
                x={x + CELL_W * 4}
                y={y + CELL_H - 4}
                textAnchor="middle"
                fontSize={20}
                fontWeight={700}
                fill="var(--color-accent)"
                letterSpacing="3"
                opacity={0.85}
              >
                {annotation.label}
              </text>
            );
          }

          if (annotation.kind === "ZONE") {
            return (
              <g key={annotation.id}>
                <rect
                  x={x + 1}
                  y={y + 1}
                  width={Math.max(width, CELL_W * 4)}
                  height={CELL_H - 2}
                  rx={3}
                  fill="var(--color-ink-700)"
                  stroke="var(--color-line)"
                />
                <text
                  x={x + 8}
                  y={y + CELL_H - 6}
                  fontSize={12}
                  fontWeight={600}
                  fill="var(--color-text)"
                >
                  {annotation.label}
                </text>
              </g>
            );
          }

          if (annotation.kind === "RANGEE") {
            return (
              <text
                key={annotation.id}
                x={x + CELL_W / 2}
                y={y + CELL_H / 2 + 3}
                textAnchor="middle"
                fontSize={9}
                fill="var(--color-text-faint)"
              >
                {annotation.label}
              </text>
            );
          }

          return (
            <g key={annotation.id}>
              <rect
                x={x + 1}
                y={y + 1}
                width={width - 2}
                height={height - 2}
                rx={3}
                fill={isStair ? "var(--color-ink-700)" : "transparent"}
                stroke={isStair ? "var(--color-accent)" : "var(--color-line)"}
                strokeDasharray={isEmpty ? "3 3" : undefined}
              />
              <text
                x={x + width / 2}
                y={y + height / 2 + 4}
                textAnchor="middle"
                fontSize={isStair ? 11 : 12}
                fill={isStair ? "var(--color-accent)" : "var(--color-text-faint)"}
              >
                {annotation.label}
              </text>
            </g>
          );
        })}

        {positioned.map((seat) => {
          const status = statusByCode.get(seat.status);
          const selected = seat.id === selectedSeatId;
          const zone = zoneById.get(seat.zoneId);
          return (
            <rect
              key={seat.id}
              x={xOf(seat.gridCol as string) + 1.5}
              y={yOf(seat.gridRow as number) + 1.5}
              width={CELL_W - 3}
              height={CELL_H - 3}
              rx={3}
              fill={status?.color ?? "var(--color-se-off)"}
              fillOpacity={selected ? 1 : 0.6}
              stroke={selected ? "var(--color-accent)" : "var(--color-ink-900)"}
              strokeWidth={selected ? 2.5 : 1}
              className="cursor-pointer"
              onClick={() => onSelectSeat(seat.id)}
            >
              <title>
                {`${seat.label ?? seat.code} · ${zone?.name ?? ""} · ${
                  status?.label ?? seat.status
                }`}
              </title>
            </rect>
          );
        })}

        {moveMode
          ? Array.from({ length: ROWS }, (_, rowIndex) =>
              Array.from({ length: COLS }, (_, colIndex) => {
                const gridRow = TOP + rowIndex;
                const gridCol = numberToColumn(LEFT + colIndex);
                return (
                  <rect
                    key={`cell-${gridRow}-${gridCol}`}
                    x={xOf(gridCol)}
                    y={yOf(gridRow)}
                    width={CELL_W}
                    height={CELL_H}
                    fill="transparent"
                    className="cursor-crosshair"
                    onClick={() => onCellClick?.(gridRow, gridCol)}
                  >
                    <title>{`Déplacer vers ${gridCol}${gridRow}`}</title>
                  </rect>
                );
              }),
            )
          : null}
      </svg>
    </div>
  );
}
