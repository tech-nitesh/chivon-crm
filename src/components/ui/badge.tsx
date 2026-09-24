import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary-light text-primary",
        success: "bg-success-light text-[#15803d]",
        warning: "bg-warning-light text-[#92400e]",
        destructive: "bg-[#fee2e2] text-[#991b1b]",
        info: "bg-info-light text-[#1d4ed8]",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

/**
 * Map common status strings to badge variants
 */
function StatusBadge({ status, className }: { status: string; className?: string }) {
  const variantMap: Record<string, "success" | "warning" | "destructive" | "info" | "default" | "secondary"> = {
    // General
    active: "success",
    completed: "success",
    done: "success",
    approved: "success",
    paid: "success",
    won: "success",
    connected: "success",
    synced: "success",
    
    // Warning states
    pending: "warning",
    in_progress: "info",
    in_review: "info",
    qualified: "info",
    draft: "secondary",
    scheduled: "info",
    pending_approval: "warning",
    partially_paid: "warning",
    
    // Danger states
    overdue: "destructive",
    lost: "destructive",
    cancelled: "destructive",
    rejected: "destructive",
    failed: "destructive",
    blocked: "destructive",
    error: "destructive",
    delayed: "destructive",
    
    // Neutral
    new: "default",
    closed: "secondary",
    expired: "secondary",
    sent: "info",
    received: "info",
  }

  const variant = variantMap[status] || "secondary"
  const label = status.replace(/_/g, " ")

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  )
}

export { Badge, badgeVariants, StatusBadge }
