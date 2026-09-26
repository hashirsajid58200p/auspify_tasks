import Link from "next/link";
import {
  Search,
  Briefcase,
  Building2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Users,
  Code2,
  Palette,
  TrendingUp,
  Cpu,
  Headphones,
  Globe2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFeaturedPublishedJobs } from "@/server/services/catalog";
import { getAllCategories } from "@/server/services/categories";
import { JobCard } from "@/components/catalog/job-card";

export const dynamic = "force-dynamic";

const HIRING_COMPANIES = [
  "Google",
  "Vercel",
  "MongoDB",
  "Stripe",
  "GitHub",
  "Linear",
  "Supabase",
  "Tailwind Labs",
];

const CATEGORY_COLORS = [
  "bg-[#2F81F7]",
  "bg-[#FF6B7A]",
  "bg-[#FFC224]",
  "bg-[#6366F1]",
  "bg-[#10B981]",
  "bg-[#FDB927]",
];

export default async function HomePage() {
  const [featuredJobs, categories] = await Promise.all([
    getFeaturedPublishedJobs(4),
    getAllCategories(),
  ]);

  const serializedJobs = featuredJobs.map((job: any) => ({
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
    companyId: job.companyId
      ? {
          _id: job.companyId._id?.toString(),
          name: job.companyId.name,
          slug: job.companyId.slug,
          logoUrl: job.companyId.logoUrl,
          location: job.companyId.location,
        }
      : undefined,
    categoryId: job.categoryId
      ? {
          _id: job.categoryId._id?.toString(),
          name: job.categoryId.name,
          slug: job.categoryId.slug,
        }
      : undefined,
  }));

  return (
    <div className="flex flex-col gap-20 md:gap-28 overflow-hidden">
      {/* 1. Hero Section */}
      <section className="container mx-auto px-4 pt-8 md:pt-16">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-black bg-white dark:bg-[#191919] shadow-neo-sm">
              <Sparkles className="w-4 h-4 text-[#FFC224] fill-[#FFC224]" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Transparent Job Search Engine
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08]">
              Connecting <br />
              <span className="bg-[#FF6B7A] text-white px-3 py-1 inline-block border-2 border-black shadow-neo-sm transform -rotate-1">
                Top Talent
              </span>{" "}
              with{" "}
              <span className="bg-[#2F81F7] text-white px-3 py-1 inline-block border-2 border-black shadow-neo-sm transform rotate-1">
                Verified Teams
              </span>
            </h1>

            <p className="text-muted-foreground text-base sm:text-lg md:text-xl font-medium max-w-xl leading-relaxed">
              No ghosting. No black holes. Real-time application tracking powered by a strict state
              machine, immutable candidate snapshots, and verified employer profiles.
            </p>

            {/* Quick Search Bar */}
            <form
              action="/jobs"
              method="GET"
              className="p-2 sm:p-3 bg-white dark:bg-[#191919] border-2 md:border-3 border-black rounded-2xl md:rounded-3xl shadow-neo flex flex-col sm:flex-row gap-2 max-w-xl"
            >
              <div className="flex-1 flex items-center gap-3 px-3">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <input
                  name="q"
                  type="text"
                  placeholder="Job title, skill (e.g. React), or location..."
                  className="w-full bg-transparent border-none text-sm md:text-base font-semibold focus:outline-hidden"
                />
              </div>
              <Button type="submit" size="lg" className="rounded-xl font-black">
                Find Jobs
              </Button>
            </form>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs sm:text-sm font-bold text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>Verified Employers</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2F81F7]" />
                <span>Immutable Snapshots</span>
              </div>
            </div>
          </div>

          {/* Neo-brutalist Visual Hero Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md bg-[#FFE500] border-4 border-black rounded-3xl p-6 shadow-neo-lg space-y-6 transform rotate-1 hover:rotate-0 transition-transform">
              <div className="flex items-center justify-between border-b-2 border-black pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#FF6B7A] border-2 border-black" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#FFC224] border-2 border-black" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#10B981] border-2 border-black" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-black">
                  Job Match Verified
                </span>
              </div>

              <div className="bg-white dark:bg-[#191919] border-3 border-black rounded-2xl p-5 shadow-neo-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl border-2 border-black bg-[#2F81F7] text-white flex items-center justify-center font-black text-xl">
                    TS
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base leading-tight">Software Engineer</h3>
                    <p className="text-xs font-bold text-muted-foreground">
                      Remote • $140k - $180k
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant="outline" className="border-2 border-black text-[11px] font-bold">
                    Next.js
                  </Badge>
                  <Badge variant="outline" className="border-2 border-black text-[11px] font-bold">
                    TypeScript
                  </Badge>
                  <Badge variant="outline" className="border-2 border-black text-[11px] font-bold">
                    MongoDB
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-extrabold text-black">
                  <span>Application Status</span>
                  <span>Under Review</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2.5 border border-black overflow-hidden">
                  <div className="bg-[#2F81F7] h-full w-3/5" />
                </div>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Snapshot captured on submission • Profile protected
                </p>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-black">
                <span>Status Tracker</span>
                <span className="bg-white px-3 py-1 rounded-full border-2 border-black">
                  Stage 3 of 5
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Company Stripe Marquee */}
      <section className="border-y-4 border-black bg-[#EDEDED] dark:bg-neutral-900 py-6 overflow-hidden">
        <div className="container mx-auto px-4 mb-3 text-center">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Trusted by teams building modern digital products
          </p>
        </div>
        <div className="flex w-max animate-marquee gap-8 md:gap-14 items-center">
          {[...HIRING_COMPANIES, ...HIRING_COMPANIES].map((comp, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-5 py-2 rounded-xl border-2 border-black bg-white dark:bg-[#191919] font-black text-sm md:text-base text-foreground shadow-neo-sm shrink-0"
            >
              <Building2 className="w-4 h-4 text-[#2F81F7]" />
              <span>{comp}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Sectors / Categories Grid with Real Counts */}
      <section className="container mx-auto px-4 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Explore Opportunities by{" "}
            <span className="bg-[#FFC224] text-black px-3 py-0.5 inline-block border-2 border-black shadow-neo-sm">
              Sector
            </span>
          </h2>
          <p className="text-muted-foreground text-base font-medium">
            Browse verified job postings filtered across industry specializations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, i) => {
            const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
            return (
              <Link
                key={cat._id.toString()}
                href={`/jobs?categoryId=${cat._id.toString()}`}
                className="group block"
              >
                <Card className="h-full group-hover:translate-y-[-4px] group-hover:shadow-neo-lg transition-all border-3 border-black">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center border-2 border-black shadow-neo-sm shrink-0`}
                    >
                      <Briefcase className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-extrabold text-lg text-foreground group-hover:text-[#2F81F7] transition-colors truncate">
                        {cat.name}
                      </h3>
                      <p className="text-xs font-bold text-muted-foreground">
                        {cat.jobCount || 0} active {cat.jobCount === 1 ? "role" : "roles"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. How It Works (Inverted Dark Section matching design) */}
      <section className="bg-black text-white border-y-4 border-black py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              <Badge className="bg-[#6366F1] text-white border-2 border-white uppercase text-[11px] font-bold">
                Transparent Pipeline
              </Badge>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
                How Job Portal Works for{" "}
                <span className="bg-[#FF6B7A] text-white px-2 py-0.5 inline-block">Both Sides</span>
              </h2>
              <p className="text-neutral-400 font-medium leading-relaxed">
                We replaced vague application black holes with an auditable finite state machine
                that guarantees candidate snapshot immutability and honest hiring stages.
              </p>
              <div className="pt-2">
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl font-bold bg-[#FFE500] text-black hover:bg-[#FFD600] border-2 border-white"
                >
                  <Link href="/jobs">Browse Verified Openings</Link>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="bg-neutral-900 border-3 border-neutral-700 rounded-3xl p-6 md:p-8 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#2F81F7] text-white font-black flex items-center justify-center border-2 border-white text-lg">
                  1
                </div>
                <h3 className="text-xl font-black">Search & Direct Filter</h3>
                <p className="text-neutral-400 text-sm font-medium leading-relaxed">
                  Search live published jobs with multi-facet filters across workplace model,
                  compensation, experience, and verified company tags.
                </p>
              </div>

              <div className="bg-neutral-900 border-3 border-neutral-700 rounded-3xl p-6 md:p-8 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#FF6B7A] text-white font-black flex items-center justify-center border-2 border-white text-lg">
                  2
                </div>
                <h3 className="text-xl font-black">Immutable Candidate Snapshot</h3>
                <p className="text-neutral-400 text-sm font-medium leading-relaxed">
                  When you apply, your profile snapshot is permanently preserved as submitted.
                  Future profile changes never alter what an employer evaluates.
                </p>
              </div>

              <div className="bg-neutral-900 border-3 border-neutral-700 rounded-3xl p-6 md:p-8 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#10B981] text-white font-black flex items-center justify-center border-2 border-white text-lg">
                  3
                </div>
                <h3 className="text-xl font-black">State Machine Auditability</h3>
                <p className="text-neutral-400 text-sm font-medium leading-relaxed">
                  Status changes are governed strictly by state machine rules. Receive instant
                  visibility into whether your application is under review, shortlisted, or
                  scheduled for interview.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Featured Jobs Section with Real Published Jobs */}
      <section className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
          <div>
            <Badge className="bg-[#2F81F7] text-white border-2 border-black uppercase text-[11px] font-bold mb-2">
              Recent Openings
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Featured Opportunities
            </h2>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-2 border-black font-bold rounded-xl shadow-neo-sm"
          >
            <Link href="/jobs" className="flex items-center gap-2">
              <span>View All Jobs</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {serializedJobs.length === 0 ? (
          <div className="bg-white dark:bg-[#191919] border-3 border-black rounded-3xl p-10 text-center shadow-neo space-y-3">
            <div className="w-14 h-14 rounded-2xl border-2 border-black bg-[#FFE500] mx-auto flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-black" />
            </div>
            <h3 className="text-xl font-black">No published openings yet</h3>
            <p className="text-sm font-medium text-muted-foreground max-w-md mx-auto">
              Be the first employer to publish an opening or sign up to get notified when roles go
              live!
            </p>
            <Button asChild className="rounded-xl font-bold mt-2">
              <Link href="/register">Post a Job as Employer</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {serializedJobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* 6. Bottom CTA Card */}
      <section className="container mx-auto px-4 max-w-6xl pb-8">
        <div className="bg-[#2F81F7] text-white border-4 border-black rounded-3xl p-8 md:p-14 shadow-neo-lg text-center space-y-6">
          <Badge className="bg-white text-black border-2 border-black font-extrabold uppercase text-xs">
            Start Today
          </Badge>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto leading-tight">
            Ready to hire exceptional talent or find your next role?
          </h2>
          <p className="text-white/90 text-base md:text-lg font-medium max-w-xl mx-auto leading-relaxed">
            Create an account in 30 seconds. Choose whether you&apos;re seeking a role or hiring
            candidates.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Button
              asChild
              size="lg"
              className="bg-black text-white hover:bg-neutral-900 border-2 border-white rounded-2xl w-full sm:w-auto"
            >
              <Link href="/register" className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>Sign Up as Seeker</span>
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-white text-black border-2 border-black rounded-2xl w-full sm:w-auto"
            >
              <Link href="/register" className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                <span>Post as Employer</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* JSON-LD WebApplication Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Job Portal",
            url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            applicationCategory: "BusinessApplication",
            operatingSystem: "All",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
          }),
        }}
      />
    </div>
  );
}
