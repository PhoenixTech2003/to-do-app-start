import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium shrink-0 select-none",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    // Weighted press: the control sinks under the finger, then settles.
    "transition-[transform,box-shadow,background-color,border-color,color] duration-[var(--dur-2)] ease-[var(--ease-out)]",
    "active:translate-y-px active:duration-[var(--dur-1)]",
    "disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none",
    "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/25",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          // Lit top edge — the control reads as a solid key, not a coloured box.
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),var(--elev-1)]",
          "hover:bg-[color-mix(in_srgb,var(--primary)_92%,#000)]",
          "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),var(--elev-2)]",
          "active:shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.18)]",
        ],
        destructive: [
          "bg-destructive text-white",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16),var(--elev-1)]",
          "hover:bg-[color-mix(in_srgb,var(--destructive)_92%,#000)]",
          "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16),var(--elev-2)]",
          "active:shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.2)]",
          "focus-visible:outline-destructive",
        ],
        outline: [
          "border border-hairline-strong bg-card text-foreground shadow-elev-1",
          "hover:bg-accent hover:text-accent-foreground hover:border-[color-mix(in_srgb,var(--foreground)_20%,var(--border))]",
          "hover:shadow-elev-2",
          "active:shadow-inset-well",
        ],
        secondary: [
          "bg-secondary text-secondary-foreground shadow-elev-1",
          "hover:bg-[color-mix(in_srgb,var(--secondary)_88%,var(--foreground))]",
          "hover:shadow-elev-2",
          "active:shadow-inset-well",
        ],
        ghost:
          "text-foreground/80 hover:bg-accent hover:text-accent-foreground active:translate-y-0",
        link: "text-primary underline-offset-4 hover:underline active:translate-y-0",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3.5",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-5",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
