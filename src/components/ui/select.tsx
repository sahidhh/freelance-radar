import * as React from "react"
import { cn } from "@/lib/utils"

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "h-9 w-full rounded border border-outline-variant bg-surface-lowest px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = "Select"
