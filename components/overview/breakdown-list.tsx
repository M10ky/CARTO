import { Badge } from "@/components/ui/badge";
import type { StatBreakdown } from "@/lib/data/reports";

export function BreakdownList({ items }: { items: StatBreakdown[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-text-dim">Aucune donnée à afficher.</p>;
  }

  const total = items.reduce((sum, item) => sum + item.count, 0);
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.code} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <Badge tone={item.tone} dot>
              {item.label}
            </Badge>
            <span className="font-mono text-xs tabular-nums text-text-dim">
              {item.count}
              {total > 0 ? ` (${Math.round((item.count / total) * 100)}%)` : ""}
            </span>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded bg-ink-900"
            role="presentation"
          >
            <div
              className="h-full rounded bg-accent/70"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
