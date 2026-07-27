import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, type, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/70 selection:bg-primary selection:text-primary-foreground",
        "h-9 w-full min-w-0 rounded-md border border-hairline-strong px-3 py-1 text-base md:text-sm",
        // A field is a well cut into the page, not a raised box.
        "bg-surface-sunken shadow-inset-well",
        "transition-[color,box-shadow,border-color] duration-[var(--dur-2)] ease-[var(--ease-standard)]",
        "hover:border-[color-mix(in_srgb,var(--foreground)_18%,var(--border))]",
        "focus-visible:border-ring focus-visible:bg-card",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/25",
        className
      )}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
