import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef(({ className, orientation = "horizontal", ...props }, ref) => {
  const isVertical = orientation === "vertical"
  return (
    <SliderPrimitive.Root
      ref={ref}
      orientation={orientation}
      className={cn(
        "relative flex touch-none select-none items-center",
        isVertical
          ? "h-full w-2 flex-col"
          : "w-full",
        className
      )}
      {...props}>
      <SliderPrimitive.Track
        data-slot="track"
        className={cn(
          "relative grow overflow-hidden rounded-full bg-primary/20",
          isVertical ? "h-full w-1.5" : "h-1.5 w-full"
        )}>
        <SliderPrimitive.Range
          data-slot="range"
          className={cn(
            "absolute bg-primary",
            isVertical ? "w-full" : "h-full"
          )} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        data-slot="thumb"
        className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
