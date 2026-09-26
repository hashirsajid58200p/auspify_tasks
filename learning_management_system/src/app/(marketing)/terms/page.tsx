export const metadata = {
  title: "Terms of Service",
  description: "EduFlow LMS Terms of Service.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-6 animate-fade-in">
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
        Terms of Service
      </h1>
      <p className="text-xs text-muted-foreground">Last updated: September 2026</p>

      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <h2 className="text-base font-semibold text-foreground">1. Acceptance of Terms</h2>
        <p>
          By accessing EduFlow, you agree to comply with our academic integrity rules and acceptable
          use policies.
        </p>

        <h2 className="text-base font-semibold text-foreground">2. Academic Integrity</h2>
        <p>
          Quizzes must be completed independently within their allotted time limits. Assignment
          submissions must represent original work or properly cited resources.
        </p>

        <h2 className="text-base font-semibold text-foreground">3. Course Content & Intellectual Property</h2>
        <p>
          Instructors retain ownership of their course curriculums. Video materials are embedded
          strictly from authorized hosts (YouTube and Vimeo).
        </p>
      </div>
    </div>
  );
}
