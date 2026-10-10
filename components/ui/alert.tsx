import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export type AlertTone = "info" | "success" | "warning" | "danger";

const toneConfig: Record<
  AlertTone,
  { icon: LucideIcon; className: string; iconClassName: string }
> = {
  info: {
    icon: Info,
    className: "border-accent/30 bg-accent/[0.07]",
    iconClassName: "text-accent",
  },
  success: {
    icon: CircleCheck,
    className: "border-positive/30 bg-positive/[0.07]",
    iconClassName: "text-positive",
  },
  warning: {
    icon: TriangleAlert,
    className: "border-warning/30 bg-warning/[0.07]",
    iconClassName: "text-warning",
  },
  danger: {
    icon: CircleAlert,
    className: "border-negative/30 bg-negative/[0.07]",
    iconClassName: "text-negative",
  },
};

export function Alert({
  tone = "info",
  title,
  className,
  children,
  ...props
}: ComponentProps<"div"> & {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
}) {
  const { icon: Icon, className: toneClass, iconClassName } = toneConfig[tone];

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded border px-4 py-3",
        toneClass,
        className,
      )}
      {...props}
    >
      <Icon
        aria-hidden
        className={cn("mt-0.5 size-4 shrink-0", iconClassName)}
      />
      <div className="min-w-0 text-sm text-text-dim">
        {title ? (
          <p className="font-medium text-text">{title}</p>
        ) : null}
        {children ? <div className={cn(title && "mt-1")}>{children}</div> : null}
      </div>
    </div>
  );
}
