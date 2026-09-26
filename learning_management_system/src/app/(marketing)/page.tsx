import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Award,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  PlayCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getFeaturedCourses, CatalogCourseItem } from "@/server/services/catalog";
import { CourseCard } from "@/components/catalog/course-card";

export const metadata = {
  title: "EduFlow | Master Skills with Structured Online Courses",
  description:
    "Explore instructor-led courses with video lessons, hands-on assignments, server-verified quizzes, and verifiable certificates.",
};

const FEATURES = [
  {
    icon: BookOpen,
    title: "Structured Curriculum",
    description:
      "Modular lessons with HD video embeds, rich markdown reading material, and sequential progress tracking that remembers where you left off.",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: ShieldCheck,
    title: "Server-Graded Quizzes",
    description:
      "Timed evaluations featuring multiple-choice, single-select, and true/false questions with server-authoritative scoring and zero answer leaks.",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    icon: FileText,
    title: "Hands-on Assignments",
    description:
      "Submit project links and written implementations. Receive comprehensive point-based grading and personalized instructor feedback.",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    icon: Award,
    title: "Verifiable Certificates",
    description:
      "Earn unique, tamper-proof completion certificates upon reaching 100% course progress, verifiable by employers through public code lookup.",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Find Your Path",
    description: "Browse categorized courses by difficulty level, topic, or instructor.",
  },
  {
    step: "02",
    title: "Learn & Practice",
    description: "Watch video modules, read deep dives, pass quizzes, and submit projects.",
  },
  {
    step: "03",
    title: "Earn Credentials",
    description: "Reach 100% course completion and earn an unguessable verifiable credential.",
  },
];

const FAQS = [
  {
    question: "Is EduFlow completely free for students?",
    answer:
      "Yes! All published courses can be freely browsed and enrolled in. You get full access to video lessons, interactive quizzes, assignments, and verified certificates.",
  },
  {
    question: "How are quizzes graded?",
    answer:
      "Quizzes are evaluated strictly on the backend. Correct answers are never sent to your browser prior to submission, guaranteeing authentic academic integrity.",
  },
  {
    question: "Can anyone become an instructor?",
    answer:
      "To ensure high course quality, new accounts start as Students. Platform administrators review and promote qualified accounts to Instructors.",
  },
  {
    question: "How do certificate verifications work?",
    answer:
      "Each earned certificate includes a cryptographically random verification code. Anyone can enter this code at /verify to confirm the recipient name, course title, and completion date.",
  },
];

export default async function LandingPage() {
  let featuredCourses: CatalogCourseItem[] = [];
  try {
    const raw = await getFeaturedCourses(6);
    featuredCourses = raw.map((c) => ({
      ...c,
      publishedAt: null,
    }));
  } catch {
    // If DB is offline or empty, gracefully fallback to empty array
    featuredCourses = [];
  }

  return (
    <div className="flex flex-col gap-16 md:gap-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20 lg:pt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <Badge
            variant="outline"
            className="mb-6 gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border-primary/20 animate-fade-in"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation Learning Experience</span>
          </Badge>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl leading-[1.15]">
            Master In-Demand Skills with{" "}
            <span className="text-primary underline decoration-primary/30 underline-offset-8">
              Structured
            </span>{" "}
            Online Courses
          </h1>

          <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Elevate your career through instructor-guided curriculums, server-evaluated quizzes,
            practical project assignments, and industry-ready verifiable certificates.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto gap-2 text-sm font-semibold rounded-xl shadow-lg shadow-primary/25" asChild>
              <Link href="/courses">
                Explore Courses
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-sm font-semibold rounded-xl bg-card" asChild>
              <Link href="/register">Create Free Account</Link>
            </Button>
          </div>

          {/* Interactive Feature Snapshot Preview */}
          <div className="mt-12 md:mt-16 w-full max-w-5xl rounded-2xl border border-border bg-card/60 p-4 md:p-6 shadow-xl backdrop-blur-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-background/80 border border-border/60">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <PlayCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Interactive Video</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Embeds with markdown notes & transcripts</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-background/80 border border-border/60">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Secure Evaluation</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Zero leaks & server-authoritative timer</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-background/80 border border-border/60">
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Proof of Mastery</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Unique verifiable code on completion</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section (Wired to Real MongoDB Data) */}
      {featuredCourses.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                Featured Programs
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Popular Courses
              </h2>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl self-start sm:self-auto" asChild>
              <Link href="/courses">
                View All Courses
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        </section>
      )}

      {/* Core Platform Highlights */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Built for Real Learning Outcomes
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Every feature is engineered to provide genuine skill mastery and transparent tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-card rounded-2xl flex flex-col justify-between"
            >
              <div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-border/60 flex items-center text-xs font-medium text-primary gap-1">
                <span>Learn more</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works Steps */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-secondary/50 border border-border p-8 md:p-12">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              How EduFlow Works
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              A seamless progression from enrollment to certified proficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div key={step.step} className="p-6 rounded-2xl bg-card border border-border/80 space-y-3">
                <span className="text-2xl font-black text-primary/40 font-mono">
                  {step.step}
                </span>
                <h3 className="text-base font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            Everything you need to know about the platform and courses.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {FAQS.map((faq, idx) => (
            <AccordionItem
              key={idx}
              value={`faq-${idx}`}
              className="border border-border rounded-xl px-4 bg-card"
            >
              <AccordionTrigger className="text-sm font-semibold text-left py-4 hover:no-underline hover:text-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground pb-4 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Call To Action Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-8 md:p-12 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-primary-foreground/10 flex items-center justify-center mb-4">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold max-w-xl">
            Start Your Learning Journey Today
          </h2>
          <p className="mt-3 max-w-md text-xs sm:text-sm text-primary-foreground/80">
            Join hundreds of students advancing their capabilities with free, instructor-curated courses.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              variant="secondary"
              className="rounded-xl font-semibold text-foreground shadow-md"
              asChild
            >
              <Link href="/register">Sign Up for Free</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl font-semibold bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link href="/courses">Browse Catalog</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
