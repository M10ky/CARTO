import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 rounded font-medium",
    "transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
    "disabled:pointer-events-none disabled:opacity-50",
    "whitespace-nowrap select-none",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-ink-950 hover:bg-accent-strong active:bg-accent-strong",
        secondary:
          "border border-line bg-ink-800 text-text hover:border-accent/40 hover:bg-ink-700",
        ghost: "text-text-dim hover:bg-ink-800 hover:text-text",
        danger:
          "bg-negative text-ink-950 hover:brightness-110 active:brightness-95",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-5 text-sm",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  },
);

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>;

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
