import React from "react";
import { cn } from "@/lib/utils";

export type SkeletonVariant = "ghost" | "shimmer";

// Base block with variant styles
export function SkeletonBlock({
  className,
  variant = "shimmer",
  "aria-hidden": ariaHidden = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: SkeletonVariant }) {
  const isShimmer = variant === "shimmer";
  return (
    <div
      aria-hidden={ariaHidden}
      className={cn(
        "rounded-md bg-muted",
        isShimmer
          ? "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent"
          : "",
        className
      )}
      {...props}
    />
  );
}

export function SkeletonLine({
  width = "w-full",
  height = "h-4",
  className,
  variant,
}: {
  width?: string;
  height?: string;
  className?: string;
  variant?: SkeletonVariant;
}) {
  return (
    <SkeletonBlock className={cn(height, width, className)} variant={variant} />
  );
}

export function SkeletonAvatar({
  size = 40,
  className,
  variant,
}: {
  size?: number;
  className?: string;
  variant?: SkeletonVariant;
}) {
  return (
    <SkeletonBlock
      className={cn("rounded-full", className)}
      style={{ width: size, height: size }}
      variant={variant}
    />
  );
}

export function SkeletonCard({
  lines = 3,
  withAvatar = false,
  variant,
  className,
}: {
  lines?: number;
  withAvatar?: boolean;
  variant?: SkeletonVariant;
  className?: string;
}) {
  return (
    <div
      className={cn("p-4 border rounded-xl bg-card", className)}
      aria-hidden="true"
    >
      <div className="flex items-start gap-3">
        {withAvatar && <SkeletonAvatar size={40} variant={variant} />}
        <div className="flex-1 space-y-2">
          <SkeletonLine height="h-4" width="w-2/3" variant={variant} />
          {Array.from({ length: lines }).map((_, i) => (
            <SkeletonLine
              key={i}
              height="h-3"
              width={i % 2 ? "w-4/5" : "w-3/5"}
              variant={variant}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonTableRow({
  cols = 5,
  variant,
  className,
}: {
  cols?: number;
  variant?: SkeletonVariant;
  className?: string;
}) {
  return (
    <tr className={cn(className)} aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <SkeletonLine height="h-4" variant={variant} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonGrid({
  columns = 3,
  count = 6,
  variant,
  cardLines = 3,
  className,
}: {
  columns?: number;
  count?: number;
  variant?: SkeletonVariant;
  cardLines?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns}`,
        className
      )}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={cardLines} withAvatar variant={variant} />
      ))}
    </div>
  );
}
