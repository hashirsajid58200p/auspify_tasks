import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] rounded-xl",
        outline:
          "bg-white text-black dark:bg-[#191919] dark:text-white border-2 border-black dark:border-white/50 shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] rounded-xl",
        secondary:
          "bg-[#F5F5F5] text-black dark:bg-[#262626] dark:text-white border-2 border-black dark:border-white/30 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700",
        destructive:
          "bg-[#E7000B] text-white border-2 border-black shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] rounded-xl",
        ghost: "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-foreground rounded-lg",
        link: "text-primary underline-offset-4 hover:underline",
        blue: "bg-[#2F81F7] text-white border-2 border-black shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] rounded-xl",
        yellow:
          "bg-[#FFC224] text-black border-2 border-black shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] rounded-xl",
        coral:
          "bg-[#FF6B7A] text-white border-2 border-black shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] rounded-xl",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-14 rounded-2xl px-8 text-base",
        icon: "size-10 rounded-xl",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-12 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
