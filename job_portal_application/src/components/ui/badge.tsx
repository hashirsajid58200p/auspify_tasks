import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border-2 border-black dark:border-white/50 px-3 py-1 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-black text-white dark:bg-white dark:text-black",
        secondary: "bg-[#F5F5F5] text-black dark:bg-[#262626] dark:text-white",
        destructive: "bg-[#E7000B] text-white",
        outline: "bg-white text-black dark:bg-[#191919] dark:text-white",
        blue: "bg-[#2F81F7] text-white",
        coral: "bg-[#FF6B7A] text-white",
        yellow: "bg-[#FFC224] text-black",
        indigo: "bg-[#6366F1] text-white",
        green: "bg-[#10B981] text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
