import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        {
          "border-transparent bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200":
            variant === "default",
          "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200":
            variant === "success",
          "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200":
            variant === "warning",
          "border-transparent bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200":
            variant === "destructive",
          "border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300":
            variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
