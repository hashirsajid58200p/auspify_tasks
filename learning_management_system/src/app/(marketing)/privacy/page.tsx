export const metadata = {
  title: "Privacy Policy",
  description: "EduFlow LMS Privacy Policy and data protection commitments.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-6 animate-fade-in">
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
        Privacy Policy
      </h1>
      <p className="text-xs text-muted-foreground">Last updated: September 2026</p>

      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <h2 className="text-base font-semibold text-foreground">1. Information We Collect</h2>
        <p>
          We collect basic account credentials (name, email address, password hashes) and records
          of your course enrollments, lesson completions, quiz attempts, and assignment submissions.
        </p>

        <h2 className="text-base font-semibold text-foreground">2. How We Protect Your Data</h2>
        <p>
          All passwords are encrypted using state-of-the-art argon2id hashing. Session cookies are
          httpOnly and authenticated via pinned JWT algorithms. We do not sell your personal data.
        </p>

        <h2 className="text-base font-semibold text-foreground">3. Account Deletion & Rights</h2>
        <p>
          Users may delete their account at any time via Settings, removing personal records and
          session tokens in accordance with our platform security checklist.
        </p>
      </div>
    </div>
  );
}
