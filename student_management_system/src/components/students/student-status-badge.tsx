import { Badge } from "@/components/ui/badge";

interface StudentStatusBadgeProps {
  status: string;
  className?: string;
}

export function StudentStatusBadge({ status, className }: StudentStatusBadgeProps) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge
          variant="secondary"
          className={`bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium ${className || ""}`}
        >
          Active
        </Badge>
      );
    case "INACTIVE":
      return (
        <Badge variant="outline" className={`text-muted-foreground font-medium ${className || ""}`}>
          Inactive
        </Badge>
      );
    case "GRADUATED":
      return (
        <Badge variant="default" className={`font-medium ${className || ""}`}>
          Graduated
        </Badge>
      );
    case "TRANSFERRED":
      return (
        <Badge
          variant="secondary"
          className={`bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium ${className || ""}`}
        >
          Transferred
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={className}>
          {status}
        </Badge>
      );
  }
}
