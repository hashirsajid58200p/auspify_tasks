import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-3xl" />
    </div>
  );
}
