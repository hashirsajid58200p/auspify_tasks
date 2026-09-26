import Link from "next/link";
import { Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  href?: string;
  showTagline?: boolean;
}

export function BrandLogo({ className, href = "/", showTagline = false }: BrandLogoProps) {
  return (
    <Link href={href} className={cn("flex items-center gap-3 group focus:outline-none", className)}>
      <div className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-xl border-2 border-black dark:border-white/50 flex items-center justify-center flex-shrink-0 shadow-neo-sm group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:shadow-none transition-all">
        <Briefcase className="w-5 h-5 stroke-[2.5]" />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
          Job
          <span className="bg-[#2F81F7] text-white px-1.5 py-0.5 rounded-md text-sm uppercase tracking-wider">
            Portal
          </span>
        </span>
        {showTagline && (
          <span className="text-[11px] font-semibold text-muted-foreground -mt-0.5">
            Connecting Talent & Employers
          </span>
        )}
      </div>
    </Link>
  );
}
