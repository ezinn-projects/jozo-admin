import { cn } from "@/lib/utils";
import { LoaderIcon } from "lucide-react";
import React from "react";

interface SpinProps extends React.HTMLAttributes<HTMLDivElement> {
  spinning?: boolean;
  size?: "small" | "default" | "large";
}

const Spin = React.forwardRef<HTMLDivElement, SpinProps>(
  (
    { children, className, spinning = true, size = "default", ...props },
    ref
  ) => {
    const spinSizes = {
      small: "w-4 h-4",
      default: "w-6 h-6",
      large: "w-8 h-8",
    };

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <div
          className={cn(
            "transition-opacity",
            spinning ? "opacity-40" : "opacity-100"
          )}
        >
          {children}
        </div>
        {spinning && (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-background/60" />
            <LoaderIcon className={cn("animate-spin z-50", spinSizes[size])} />
          </div>
        )}
      </div>
    );
  }
);

Spin.displayName = "Spin";

export { Spin };
