import React from "react";
import { cn } from "@/utils";

interface SpinnerProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = "medium",
  className,
}) => {
  const sizeStyles = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-t-transparent",
        sizeStyles[size],
        "border-primary",
        className
      )}
    />
  );
};
