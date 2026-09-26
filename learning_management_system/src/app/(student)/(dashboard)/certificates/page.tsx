import { Metadata } from "next";
import Link from "next/link";
import { Award, CheckCircle, ExternalLink, FileCheck, Printer, ShieldCheck } from "lucide-react";
import { requireServerUser } from "@/server/auth/server-session";
import { getStudentCertificates } from "@/server/services/certificates";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Earned Certificates | EduFlow LMS",
  description: "Verifiable credentials awarded upon completing course requirements.",
};

export default async function StudentCertificatesPage() {
  const user = await requireServerUser(["STUDENT"]);
  const certificates = await getStudentCertificates(user.userId);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Earned Certificates
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Verifiable credentials awarded upon achieving 100% completion across course syllabus.
          </p>
        </div>

        <Button variant="outline" size="sm" className="rounded-xl self-start sm:self-auto" asChild>
          <Link href="/verify">
            <ShieldCheck className="w-4 h-4 mr-2 text-primary" />
            Verification Portal
          </Link>
        </Button>
      </div>

      {certificates.length === 0 ? (
        <Card className="rounded-2xl border-border bg-card p-12 text-center">
          <FileCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-70" />
          <h2 className="text-lg font-semibold text-foreground">No certificates earned yet</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
            Complete all lessons, pass all module quizzes, and submit assignments in an enrolled course to automatically receive your verified credential.
          </p>
          <div className="mt-6">
            <Button size="sm" className="rounded-xl" asChild>
              <Link href="/my-courses">Go to My Courses</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <Card
              key={cert.id}
              className="rounded-2xl border-border bg-card shadow-xs overflow-hidden flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="font-mono text-2xs uppercase tracking-wider">
                    {cert.code}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    {cert.course.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Instructed by <span className="font-medium text-foreground">{cert.course.instructorName}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Issued on {new Date(cert.issuedAt).toLocaleDateString(undefined, { dateStyle: "long" })}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-muted/30 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
                <Button size="sm" variant="default" className="rounded-xl text-xs" asChild>
                  <Link href={`/certificates/${cert.id}`} target="_blank">
                    <Printer className="w-3.5 h-3.5 mr-1.5" />
                    Print Certificate
                  </Link>
                </Button>

                <Button size="sm" variant="ghost" className="rounded-xl text-xs" asChild>
                  <Link href={`/verify?code=${cert.code}`} target="_blank">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Verify Publicly
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
