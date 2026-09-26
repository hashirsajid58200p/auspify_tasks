import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, FileX2, Search, ShieldCheck, Award, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCertificateByCode } from "@/server/services/certificates";

export const metadata: Metadata = {
  title: "Verify Certificate | EduFlow LMS",
  description: "Verify the authenticity of an EduFlow course completion credential.",
  robots: {
    index: false,
    follow: false,
  },
};

interface VerifyPageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function VerifyCertificatePage({ searchParams }: VerifyPageProps) {
  const { code } = await searchParams;
  const queryCode = code?.trim() || "";

  let result = null;
  let error = null;

  if (queryCode) {
    try {
      result = await getCertificateByCode(queryCode);
    } catch {
      error = "Certificate not found. Please verify the code and try again.";
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Credential Verification
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
          Enter the unique credential code found on the certificate to verify authenticity directly against the EduFlow registry.
        </p>
      </div>

      {/* Code lookup form */}
      <Card className="rounded-2xl border-border bg-card p-6 shadow-xs">
        <form method="GET" action="/verify" className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              name="code"
              defaultValue={queryCode}
              placeholder="e.g. EDU-A1B2C3D4"
              className="pl-9 h-11 text-xs sm:text-sm font-mono uppercase rounded-xl bg-background"
              required
            />
          </div>
          <Button type="submit" className="rounded-xl h-11 px-6 shadow-xs">
            Verify
          </Button>
        </form>
      </Card>

      {/* Verification Result */}
      {result && (
        <Card className="rounded-2xl border-emerald-600/30 bg-card shadow-md overflow-hidden animate-fade-in">
          <div className="bg-emerald-600/10 border-b border-emerald-600/20 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Authentic Credential Verified</span>
            </div>
            <Badge className="bg-emerald-600 text-white text-2xs font-mono uppercase">
              {result.code}
            </Badge>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Awarded To
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                {result.studentName}
              </h2>
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Course Completed
              </span>
              <h3 className="text-lg font-semibold text-primary">
                {result.course.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                Instructed by {result.course.instructorName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50 text-xs">
              <div>
                <span className="text-muted-foreground block">Conferred On</span>
                <span className="font-semibold text-foreground">
                  {new Date(result.issuedAt).toLocaleDateString(undefined, {
                    dateStyle: "long",
                  })}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Issuer</span>
                <span className="font-semibold text-foreground">
                  {result.issuer}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button size="sm" variant="outline" className="rounded-xl text-xs" asChild>
                <Link href={`/courses/${result.course.slug}`}>
                  View Course Details
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5 p-8 text-center space-y-2 animate-fade-in">
          <FileX2 className="w-10 h-10 text-destructive mx-auto" />
          <h2 className="text-base font-bold text-destructive">Invalid or Unrecognized Credential</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {error}
          </p>
        </Card>
      )}
    </div>
  );
}
