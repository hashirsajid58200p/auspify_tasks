import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, MapPin, ExternalLink, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPublicCompanyBySlug } from "@/server/services/catalog";
import { JobCard } from "@/components/catalog/job-card";

interface CompanyProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CompanyProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const result = await getPublicCompanyBySlug(slug);
    const company = result.company;
    return {
      title: `${company.name} Careers & Open Roles | Job Portal`,
      description: company.description.slice(0, 160).trim(),
      openGraph: {
        title: `${company.name} Careers & Company Overview`,
        description: company.description.slice(0, 160).trim(),
      },
    };
  } catch {
    return {
      title: "Company Profile | Job Portal",
    };
  }
}

export default async function CompanyProfilePage({ params }: CompanyProfilePageProps) {
  const { slug } = await params;

  let result: any;
  try {
    result = await getPublicCompanyBySlug(slug);
  } catch {
    notFound();
  }

  const { company, jobs } = result;

  const serializedJobs = jobs.map((job: any) => ({
    _id: job._id.toString(),
    title: job.title,
    slug: job.slug,
    type: job.type,
    locationType: job.locationType,
    location: job.location,
    experienceLevel: job.experienceLevel,
    skills: job.skills || [],
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency || "USD",
    publishedAt: job.publishedAt ? new Date(job.publishedAt).toISOString() : null,
    createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
    companyId: {
      _id: company._id.toString(),
      name: company.name,
      slug: company.slug,
      logoUrl: company.logoUrl,
      location: company.location,
    },
    categoryId: job.categoryId
      ? {
          _id: job.categoryId._id?.toString(),
          name: job.categoryId.name,
          slug: job.categoryId.slug,
        }
      : undefined,
  }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      {/* Back to companies */}
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="font-bold flex items-center gap-1.5 -ml-2"
        >
          <Link href="/companies">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Companies</span>
          </Link>
        </Button>
      </div>

      {/* Company Header Card */}
      <div className="bg-white dark:bg-[#191919] border-2 md:border-4 border-black rounded-3xl p-6 md:p-8 shadow-neo space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {company.logoUrl ? (
              <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl border-2 md:border-3 border-black overflow-hidden bg-neutral-100">
                <Image
                  src={company.logoUrl}
                  alt={company.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                  priority
                />
              </div>
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl border-2 md:border-3 border-black bg-[#FFE500] flex items-center justify-center font-black text-black text-2xl md:text-3xl">
                {company.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="space-y-1">
              <h1 className="text-2xl md:text-4xl font-black text-neutral-900 dark:text-neutral-100">
                {company.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {company.location}
                </span>
                <span>•</span>
                <span>{company.industry}</span>
                <span>•</span>
                <span>{company.size} employees</span>
              </div>
            </div>
          </div>

          {company.website && (
            <Button
              asChild
              variant="outline"
              className="border-2 border-black rounded-xl font-bold"
            >
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <span>Visit Website</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>

        {/* Description */}
        <div className="pt-4 border-t-2 border-black/10 dark:border-white/10">
          <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-2">
            About Company
          </h2>
          <p className="text-sm md:text-base text-neutral-800 dark:text-neutral-200 leading-relaxed font-medium whitespace-pre-wrap">
            {company.description}
          </p>
        </div>
      </div>

      {/* Published Positions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-black">
            Open Positions ({serializedJobs.length})
          </h2>
          <Button asChild variant="ghost" size="sm" className="font-bold text-xs">
            <Link href={`/jobs?q=${encodeURIComponent(company.name)}`}>Search All Jobs</Link>
          </Button>
        </div>

        {serializedJobs.length === 0 ? (
          <div className="bg-white dark:bg-[#191919] border-2 md:border-3 border-black rounded-3xl p-8 text-center shadow-neo space-y-3">
            <div className="w-12 h-12 rounded-xl border-2 border-black bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-black text-base">No active openings</h3>
            <p className="text-xs font-medium text-muted-foreground max-w-sm mx-auto">
              This organization does not currently have any published listings. Check back later!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {serializedJobs.map((job: any) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
