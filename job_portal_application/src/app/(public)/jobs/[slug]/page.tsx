import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Clock,
  Eye,
  ExternalLink,
  DollarSign,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPublishedJobBySlug } from "@/server/services/catalog";
import {
  formatSalary,
  formatJobType,
  formatLocationType,
  formatExperienceLevel,
  formatRelativeTime,
} from "@/lib/formatters";
import { JobJsonLd } from "@/components/catalog/json-ld";
import { ApplyModal } from "@/components/applications/apply-modal";
import { SaveButton } from "@/components/applications/save-button";

interface JobDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: JobDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const job = await getPublishedJobBySlug(slug);
    const company = job.companyId as any;
    const companyName = company?.name || "Hiring Company";

    return {
      title: `${job.title} at ${companyName} | Job Portal`,
      description: job.description.slice(0, 160).trim(),
      openGraph: {
        title: `${job.title} at ${companyName}`,
        description: job.description.slice(0, 160).trim(),
        type: "article",
      },
    };
  } catch {
    return {
      title: "Job Listing | Job Portal",
    };
  }
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { slug } = await params;

  let job: any;
  try {
    job = await getPublishedJobBySlug(slug);
  } catch {
    notFound();
  }

  const company = job.companyId as any;
  const category = job.categoryId as any;
  const companyName = company?.name || "Company";

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      {/* Schema.org JobPosting Structured Data */}
      <JobJsonLd job={job} />

      {/* Back button */}
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="font-bold flex items-center gap-1.5 -ml-2"
        >
          <Link href="/jobs">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Job Catalog</span>
          </Link>
        </Button>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white dark:bg-[#191919] border-2 md:border-4 border-black rounded-3xl p-6 md:p-8 shadow-neo space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {company?.logoUrl ? (
              <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl border-2 md:border-3 border-black overflow-hidden bg-neutral-100">
                <Image
                  src={company.logoUrl}
                  alt={companyName}
                  fill
                  className="object-cover"
                  sizes="80px"
                  priority
                />
              </div>
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl border-2 md:border-3 border-black bg-[#FFE500] flex items-center justify-center font-black text-black text-2xl md:text-3xl">
                {companyName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="space-y-1">
              <h1 className="text-2xl md:text-4xl font-black text-neutral-900 dark:text-neutral-100">
                {job.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-muted-foreground">
                {company?.slug ? (
                  <Link
                    href={`/companies/${company.slug}`}
                    className="hover:text-black dark:hover:text-white underline underline-offset-4"
                  >
                    {companyName}
                  </Link>
                ) : (
                  <span>{companyName}</span>
                )}
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {job.location}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <SaveButton jobId={job._id.toString()} />
            <ApplyModal jobId={job._id.toString()} jobTitle={job.title} companyName={companyName} />
          </div>
        </div>

        {/* Badges and metadata bar */}
        <div className="pt-4 border-t-2 border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge className="border-2 border-black font-bold text-xs bg-neutral-100 dark:bg-neutral-800 text-foreground">
              {formatJobType(job.type)}
            </Badge>
            <Badge className="border-2 border-black font-bold text-xs bg-[#2F81F7]/10 text-[#2F81F7]">
              {formatLocationType(job.locationType)}
            </Badge>
            <Badge className="border-2 border-black font-bold text-xs bg-neutral-100 dark:bg-neutral-800 text-foreground">
              {formatExperienceLevel(job.experienceLevel)}
            </Badge>
            {category?.name && (
              <Badge className="border-2 border-black font-bold text-xs bg-[#FF6B7A]/20 text-[#D93848]">
                {category.name}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{job.viewCount} views</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Posted {formatRelativeTime(job.publishedAt || job.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Description + Company Sidebar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Job Description & Skills */}
        <div className="md:col-span-2 space-y-6">
          {/* Compensation summary card */}
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border-2 md:border-3 border-black rounded-3xl p-5 shadow-neo-sm flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Annual Compensation
              </div>
              <div className="text-xl md:text-2xl font-black text-emerald-950 dark:text-emerald-100">
                {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-[#191919] border-2 md:border-3 border-black rounded-3xl p-6 md:p-8 shadow-neo space-y-4">
            <h2 className="text-xl font-black">Role Overview</h2>
            <div className="text-sm md:text-base leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap font-medium">
              {job.description}
            </div>
          </div>

          {/* Required Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="bg-white dark:bg-[#191919] border-2 md:border-3 border-black rounded-3xl p-6 shadow-neo space-y-3">
              <h2 className="text-lg font-black">Required Skills & Technologies</h2>
              <div className="flex flex-wrap gap-2 pt-1">
                {job.skills.map((skill: string) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="border-2 border-black font-bold text-xs py-1 px-3 bg-neutral-50 dark:bg-neutral-800"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Company Snapshot */}
        <aside className="space-y-6">
          <div className="bg-white dark:bg-[#191919] border-2 md:border-3 border-black rounded-3xl p-6 shadow-neo space-y-4">
            <h3 className="text-lg font-black">About The Company</h3>

            <div className="space-y-3">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
                  Company Name
                </span>
                <span className="font-bold text-sm">{companyName}</span>
              </div>

              {company?.location && (
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
                    Headquarters
                  </span>
                  <span className="font-bold text-sm">{company.location}</span>
                </div>
              )}

              {company?.industry && (
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
                    Industry
                  </span>
                  <span className="font-bold text-sm">{company.industry}</span>
                </div>
              )}

              {company?.size && (
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
                    Company Size
                  </span>
                  <span className="font-bold text-sm">{company.size} employees</span>
                </div>
              )}

              {company?.description && (
                <div className="pt-2 border-t border-black/10 dark:border-white/10">
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed line-clamp-4">
                    {company.description}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 space-y-2">
              {company?.website && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl border-2 border-black font-bold text-xs"
                >
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5"
                  >
                    <span>Visit Website</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </Button>
              )}

              {company?.slug && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl border-2 border-black font-bold text-xs"
                >
                  <Link href={`/companies/${company.slug}`}>View All Company Jobs</Link>
                </Button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
