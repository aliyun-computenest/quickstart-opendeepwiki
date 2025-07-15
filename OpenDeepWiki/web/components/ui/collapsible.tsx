import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { ChevronDown } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleTrigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleTrigger> & {
    showIcon?: boolean
  }
>(({ className, children, showIcon = true, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleTrigger
    ref={ref}
    className={cn(
      "flex w-full items-center justify-between rounded-md p-3 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
      className
    )}
    {...props}
  >
    {children}
    {showIcon && (
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    )}
  </CollapsiblePrimitive.CollapsibleTrigger>
))
CollapsibleTrigger.displayName = CollapsiblePrimitive.CollapsibleTrigger.displayName

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>
>(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleContent
    ref={ref}
    className={cn(
      "overflow-hidden text-sm data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
      className
    )}
    {...props}
  >
    <div className="pb-3 pt-0">{children}</div>
  </CollapsiblePrimitive.CollapsibleContent>
))
CollapsibleContent.displayName = CollapsiblePrimitive.CollapsibleContent.displayName

// Card-like collapsible variant
const collapsibleCardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "border-border",
        accent: "border-accent bg-accent/5",
        muted: "border-muted bg-muted/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface CollapsibleCardProps
  extends React.ComponentPropsWithoutRef<typeof Collapsible>,
    VariantProps<typeof collapsibleCardVariants> {
  title: any
  defaultOpen?: boolean
  showIcon?: boolean
}

const CollapsibleCard = React.forwardRef<
  React.ElementRef<typeof Collapsible>,
  CollapsibleCardProps
>(({ className, variant, title, children, defaultOpen, showIcon = true, ...props }, ref) => (
  <Collapsible
    ref={ref}
    defaultOpen={defaultOpen}
    className={cn(collapsibleCardVariants({ variant }), className)}
    {...props}
  >
    <CollapsibleTrigger
      showIcon={showIcon}
      className="border-b border-border px-4 py-3 hover:bg-accent/50"
    >
      {title}
    </CollapsibleTrigger>
    <CollapsibleContent className="px-4 py-3">
      {children}
    </CollapsibleContent>
  </Collapsible>
))
CollapsibleCard.displayName = "CollapsibleCard"

export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  CollapsibleCard,
  collapsibleCardVariants,
}
