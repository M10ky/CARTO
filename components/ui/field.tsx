import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium text-text-dim"
      >
        {label}
        {required ? (
          <span className="ml-1 text-negative" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-negative" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-text-faint">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded border border-line bg-ink-900 px-3 text-sm text-text",
        "placeholder:text-text-faint",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        "aria-[invalid=true]:border-negative",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded border border-line bg-ink-900 px-3 py-2 text-sm text-text",
        "placeholder:text-text-faint",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        "aria-[invalid=true]:border-negative",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-9 w-full rounded border border-line bg-ink-900 px-3 text-sm text-text",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
