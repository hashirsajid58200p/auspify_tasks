import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Building2, Search, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getAllPublicCompanies } from "@/server/services/companies";

export const metadata: Metadata = {
  title: "Hiring Companies Directory | Job Portal",
  description:
    "Explore top companies hiring across engineering, technology, and design. View company cultures and published openings.",
};

export const dynamic = "force-dynamic";

interface CompaniesPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const { q } = await searchParams;
  const companies = await getAllPublicCompanies(q);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <Badge className="bg-[#FFC224] text-black border-2 border-black font-bold uppercase text-xs">
          Directory
        </Badge>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Hiring Companies</h1>
        <p className="text-muted-foreground font-medium text-base max-w-2xl">
          Discover verified employers, company cultures, and their currently active published
          listings.
        </p>
      </div>

      {/* Search Input */}
      <form
        method="GET"
        action="/companies"
        className="p-3 bg-white dark:bg-[#191919] border-2 md:border-3 border-black rounded-3xl shadow-neo flex flex-col sm:flex-row gap-3"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q || ""}
            placeholder="Search companies by name, industry, or location..."
            className="pl-12 border-2 border-black rounded-xl h-11 text-sm md:text-base"
          />
        </div>
        <Button
          type="submit"
          className="rounded-xl flex items-center gap-2 h-11 px-6 font-bold shadow-neo-sm"
        >
          <Search className="w-4 h-4" />
          <span>Search</span>
        </Button>
      </form>

      {/* Companies Grid */}
      {companies.length === 0 ? (
        <div className="bg-white dark:bg-[#191919] border-2 md:border-3 border-black rounded-3xl p-12 text-center shadow-neo space-y-4">
          <div className="w-16 h-16 rounded-2xl border-2 border-black bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black">No companies found</h3>
            <p className="text-sm font-medium text-muted-foreground max-w-md mx-auto">
              We couldn&apos;t find any hiring companies matching your search.
            </p>
          </div>
          {q && (
            <Button
              asChild
              variant="outline"
              className="border-2 border-black rounded-xl font-bold"
            >
              <Link href="/companies">Clear Search</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div
              key={company._id.toString()}
              className="bg-white dark:bg-[#191919] border-2 md:border-3 border-black rounded-3xl p-6 shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {company.logoUrl ? (
                    <div className="relative w-12 h-12 shrink-0 rounded-xl border-2 border-black overflow-hidden bg-neutral-100">
                      <Image
                        src={company.logoUrl}
                        alt={company.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 shrink-0 rounded-xl border-2 border-black bg-[#FFE500] flex items-center justify-center font-black text-black text-lg">
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-black text-lg truncate">{company.name}</h2>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{company.location}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 font-medium">
                  {company.description}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant="outline" className="border-2 border-black font-bold text-[11px]">
                    {company.industry}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-2 border-black font-bold text-[11px] bg-neutral-100 dark:bg-neutral-800"
                  >
                    {company.size} staff
                  </Badge>
                </div>
              </div>

              <div className="pt-3 border-t border-black/10 dark:border-white/10">
                <Button
                  asChild
                  size="sm"
                  className="w-full rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-neo-sm"
                >
                  <Link href={`/companies/${company.slug}`}>
                    <span>View Company Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
