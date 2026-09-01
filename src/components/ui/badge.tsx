import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] font-medium tracking-wide uppercase",
  {
    variants: {
      tone: {
        neutral: "bg-surface-3 text-muted",
        accent: "bg-accent-dim text-accent",
        loss: "bg-loss-dim text-loss",
        warn: "bg-warn-dim text-warn",
        fair: "bg-surface-3 text-fair",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
