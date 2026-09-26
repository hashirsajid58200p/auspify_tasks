import Link from "next/link";
import Image from "next/image";
import { MapPin, DollarSign, Clock, Building2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatSalary,
  formatJobType,
  formatLocationType,
  formatExperienceLevel,
  formatRelativeTime,
} from "@/lib/formatters";
import { SaveButton } from "@/components/applications/save-button";

export interface JobCardProps {
  job: {
    _id: string;
    title: string;
    slug: string;
    type: string;
    locationType: string;
    location: string;
    experienceLevel: string;
    skills: string[];
    salaryMin: number;
    salaryMax: number;
    salaryCurrency?: string;
    publishedAt?: string | Date | null;
    createdAt?: string | Date | null;
    companyId?: {
      _id?: string;
      name?: string;
      slug?: string;
      logoUrl?: string;
      location?: string;
    };
    categoryId?: {
      _id?: string;
      name?: string;
      slug?: string;
    };
  };
}

export function JobCard({ job }: JobCardProps) {
  const company = job.companyId;
  const companyName = company?.name || "Company";
  const companySlug = company?.slug;
  const logoUrl = company?.logoUrl;
  const postedDate = job.publishedAt || job.createdAt || new Date();

  return (
    <div className="group bg-white dark:bg-[#191919] border-2 md:border-3 border-black rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between gap-4">
      <div className="space-y-3">
        {/* Top: Company header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {logoUrl ? (
              <div className="relative w-11 h-11 shrink-0 rounded-xl border-2 border-black overflow-hidden bg-neutral-100">
                <Image src={logoUrl} alt={companyName} fill className="object-cover" sizes="44px" />
              </div>
            ) : (
              <div className="w-11 h-11 shrink-0 rounded-xl border-2 border-black bg-[#FFE500] flex items-center justify-center font-black text-black text-lg">
                {companyName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              {companySlug ? (
                <Link
                  href={`/companies/${companySlug}`}
                  className="text-sm font-bold hover:underline truncate block"
                >
                  {companyName}
                </Link>
              ) : (
                <span className="text-sm font-bold truncate block">{companyName}</span>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{job.location}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatRelativeTime(postedDate)}</span>
            </div>
            <SaveButton jobId={job._id} variant="icon" />
          </div>
        </div>

        {/* Title */}
        <div>
          <Link href={`/jobs/${job.slug}`}>
            <h3 className="text-lg md:text-xl font-black text-neutral-900 dark:text-neutral-100 group-hover:text-[#2F81F7] transition-colors leading-tight">
              {job.title}
            </h3>
          </Link>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge
            variant="outline"
            className="border-2 border-black font-bold text-xs bg-neutral-100 dark:bg-neutral-800"
          >
            {formatJobType(job.type)}
          </Badge>
          <Badge
            variant="outline"
            className="border-2 border-black font-bold text-xs bg-[#2F81F7]/10 text-[#2F81F7]"
          >
            {formatLocationType(job.locationType)}
          </Badge>
          <Badge
            variant="outline"
            className="border-2 border-black font-bold text-xs bg-neutral-100 dark:bg-neutral-800"
          >
            {formatExperienceLevel(job.experienceLevel)}
          </Badge>
        </div>

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {job.skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-black/20 text-neutral-700 dark:text-neutral-300"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="text-[11px] font-semibold px-1.5 py-0.5 text-muted-foreground">
                +{job.skills.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer: Salary + CTA */}
      <div className="pt-3 border-t-2 border-black/10 dark:border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 font-black text-sm md:text-base text-neutral-900 dark:text-neutral-100">
          <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
        </div>

        <Button
          asChild
          size="sm"
          className="rounded-xl flex items-center gap-1.5 font-bold shadow-neo-sm"
        >
          <Link href={`/jobs/${job.slug}`}>
            <span>View Role</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
