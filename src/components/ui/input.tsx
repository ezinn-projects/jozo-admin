import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, prefix, suffix, ...props }, ref) => {
    const hasPrefix = !!prefix;
    const hasSuffix = !!suffix;

    return (
      <div className="relative flex items-center">
        {hasPrefix && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-full flex items-center justify-center rounded-l-md">
            {prefix}
          </div>
        )}

        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            hasPrefix ? "pl-10" : "pl-3",
            hasSuffix ? "pr-10" : "pr-3",
            className
          )}
          ref={ref}
          {...props}
        />

        {hasSuffix && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-full flex items-center justify-center rounded-r-md">
            {suffix}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
