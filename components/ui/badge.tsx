import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export type BadgeTone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info";

const toneStyles: Record<BadgeTone, string> = {
  neutral: "border-line bg-ink-800 text-text-dim",
  accent: "border-accent/40 bg-accent/10 text-accent",
  success: "border-positive/40 bg-positive/10 text-positive",
  warning: "border-warning/40 bg-warning/10 text-warning",
  danger: "border-negative/40 bg-negative/10 text-negative",
  info: "border-se-move/40 bg-se-move/10 text-se-move",
};

export type BadgeProps = ComponentProps<"span"> & {
  tone?: BadgeTone;
  dot?: boolean;
  icon?: ReactNode;
};

/**
 * L'information n'est jamais portée par la couleur seule : le libellé reste
 * toujours présent, la pastille n'est qu'un repère visuel secondaire.
 */
export function Badge({
  tone = "neutral",
  dot = false,
  icon,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium",
        toneStyles[tone],
        className,
      )}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full bg-current"
        />
      ) : null}
      {icon}
      {children}
    </span>
  );
}
