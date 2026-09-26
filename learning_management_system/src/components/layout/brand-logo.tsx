import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  href?: string;
  className?: string;
}

export function BrandLogo({ href = "/", className }: BrandLogoProps) {
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2.5 group cursor-pointer", className)}
    >
      <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center transition-all duration-300 group-hover:scale-105 shadow-sm shadow-primary/20">
        <GraduationCap className="w-4 h-4 text-primary-foreground" />
      </div>
      <div className="flex flex-col">
        <span className="text-base font-bold tracking-tight text-foreground leading-none">
          EduFlow
        </span>
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          LMS Platform
        </span>
      </div>
    </Link>
  );
}
