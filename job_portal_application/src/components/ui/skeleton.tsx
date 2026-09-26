import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-2xl border-2 border-black/10 dark:border-white/10",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
