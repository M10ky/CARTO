export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded border border-line bg-ink-800/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-text-faint">
        {label}
      </p>
      <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-text">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-text-dim">{hint}</p> : null}
    </div>
  );
}
