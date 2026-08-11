import type { LeadStatus } from "@/db/schema"
import { cn } from "@/lib/utils"

const DOT_CLASS: Record<LeadStatus, string> = {
  NEW: "bg-on-surface-variant",
  QUALIFIED: "bg-on-surface-variant",
  RESEARCHED: "bg-on-surface-variant",
  PITCH_READY: "bg-on-surface-variant",
  CONTACTED: "bg-primary",
  REPLIED: "bg-primary",
  CALL: "bg-primary",
  PROPOSAL: "bg-primary",
  WON: "bg-success",
  LOST: "bg-error",
}

export function StatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded bg-surface-low px-2 py-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant",
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT_CLASS[status])} />
      {status.replace(/_/g, " ")}
    </span>
  )
}
