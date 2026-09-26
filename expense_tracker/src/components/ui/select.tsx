import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, children, disabled, ...props }, ref) => {
    return (
      <div className={cn("relative w-full", wrapperClassName)}>
        <select
          ref={ref}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full appearance-none cursor-pointer items-center justify-between rounded-lg border border-input bg-background px-3.5 py-2 pr-10 text-sm ring-offset-background",
            "text-foreground placeholder:text-muted-foreground",
            "shadow-xs transition-colors",
            "focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "[&>option]:bg-background [&>option]:text-foreground [&>option]:py-2",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0 text-muted-foreground opacity-60" />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
