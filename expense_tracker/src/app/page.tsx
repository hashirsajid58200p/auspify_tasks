import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  PieChart,
  Target,
  Sparkles,
  Lock,
  ChevronRight,
  Database,
  BarChart3,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F5F3] text-[#37322F] flex flex-col items-center selection:bg-[#37322F] selection:text-white">
      {/* Top Floating Pill Navigation */}
      <header className="sticky top-4 z-50 w-full max-w-4xl px-4">
        <div className="h-12 px-4 sm:px-6 bg-[#F7F5F3]/90 backdrop-blur-md border border-[rgba(55,50,47,0.12)] rounded-full shadow-xs flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-[#37322F] text-white flex items-center justify-center font-serif text-sm font-bold">
              A
            </div>
            <span className="font-serif text-lg font-medium tracking-tight text-[#2F3037]">
              Auspify
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-6 text-xs font-medium text-[rgba(55,50,47,0.80)]">
            <a href="#features" className="hover:text-[#37322F] transition-colors">
              Features
            </a>
            <a href="#security" className="hover:text-[#37322F] transition-colors">
              Security
            </a>
            <a href="#metrics" className="hover:text-[#37322F] transition-colors">
              Architecture
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-xs h-8 text-[#37322F] hover:bg-black/5 rounded-full"
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="text-xs h-8 px-4 bg-[#37322F] text-white hover:bg-[#2A2520] rounded-full shadow-xs"
            >
              <Link href="/register">Start for free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-4xl px-4 pt-16 sm:pt-24 pb-16 flex flex-col items-center text-center">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[rgba(55,50,47,0.10)] rounded-full text-xs font-medium text-[#37322F] shadow-xs mb-6">
          <Sparkles className="size-3.5 text-amber-600" />
          <span>Next-Generation Multi-Tenant Expense Intelligence</span>
        </div>

        {/* Display headline in editorial serif */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-[#37322F] leading-[1.08] max-w-3xl">
          Financial clarity without the complexity.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-[rgba(55,50,47,0.80)] max-w-xl font-normal leading-relaxed">
          Master personal cash flow with sub-second MongoDB aggregations,
          strict integer monetary accuracy, and automated budget threshold
          intelligence.
        </p>

        {/* Action CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Button
            size="lg"
            asChild
            className="h-11 px-7 bg-[#37322F] text-white hover:bg-[#2A2520] rounded-full shadow-xs font-medium text-sm gap-2"
          >
            <Link href="/register">
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="h-11 px-6 border-[rgba(55,50,47,0.16)] bg-white/80 text-[#37322F] hover:bg-white rounded-full text-sm font-medium"
          >
            <Link href="/login">Explore Live Demo</Link>
          </Button>
        </div>

        {/* Hero Interactive App Mockup Preview */}
        <div className="mt-14 w-full rounded-2xl border border-[rgba(55,50,47,0.12)] bg-white p-4 sm:p-6 shadow-sm text-left">
          <div className="flex items-center justify-between pb-4 border-b border-[rgba(55,50,47,0.08)]">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-rose-400" />
              <span className="size-3 rounded-full bg-amber-400" />
              <span className="size-3 rounded-full bg-emerald-400" />
              <span className="ml-2 text-xs font-mono text-muted-foreground">
                auspify.app/dashboard
              </span>
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              MongoDB Atlas Live
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-[#FBFAF9] border border-[rgba(55,50,47,0.06)]">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Monthly Net Balance
              </p>
              <h3 className="font-serif text-2xl font-normal text-[#37322F] mt-1">
                +$3,450.00
              </h3>
              <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                ↑ 62.7% savings rate
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FBFAF9] border border-[rgba(55,50,47,0.06)]">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Housing Budget
              </p>
              <h3 className="font-serif text-2xl font-normal text-[#37322F] mt-1">
                $1,500 / $2,000
              </h3>
              <div className="w-full bg-muted/60 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full w-[75%]" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FBFAF9] border border-[rgba(55,50,47,0.06)]">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Financial Intelligence
              </p>
              <h3 className="text-xs font-semibold text-[#37322F] mt-1">
                Spending down 14% MoM
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1">
                Discretionary purchases safely within optimal limits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="w-full max-w-4xl px-4 py-16 border-t border-[rgba(55,50,47,0.08)]">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#37322F]">
            Built with uncompromising engineering rigor.
          </h2>
          <p className="mt-3 text-sm text-[rgba(55,50,47,0.70)]">
            Everything you need for precise capital management without the bloat
            of legacy accounting software.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-[rgba(55,50,47,0.08)] shadow-xs space-y-3">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Database className="size-4" />
            </div>
            <h3 className="text-base font-semibold text-[#37322F]">
              Integer Minor Units
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No IEEE-754 floating-point inaccuracies. All monetary values are
              stored and aggregated strictly as integer cents in MongoDB Atlas.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[rgba(55,50,47,0.08)] shadow-xs space-y-3">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Target className="size-4" />
            </div>
            <h3 className="text-base font-semibold text-[#37322F]">
              Automated Budget Caps
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Targeted monthly spending caps with progressive color warnings at
              80% and destructive threshold alerts at 100%.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[rgba(55,50,47,0.08)] shadow-xs space-y-3">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BarChart3 className="size-4" />
            </div>
            <h3 className="text-base font-semibold text-[#37322F]">
              Sub-Second Analytics
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Native aggregation pipelines compute historical cash flow trends,
              category distribution donuts, and savings benchmarks on demand.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[rgba(55,50,47,0.08)] shadow-xs space-y-3">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="size-4" />
            </div>
            <h3 className="text-base font-semibold text-[#37322F]">
              Argon2id & JWT Rotation
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Military-grade argon2id password hashing, httpOnly cookies,
              automatic refresh token rotation, and family reuse replay defense.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[rgba(55,50,47,0.08)] shadow-xs space-y-3">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="size-4" />
            </div>
            <h3 className="text-base font-semibold text-[#37322F]">
              Multi-Tenant Isolation
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Rigorous service-layer query scoping ensures complete tenancy
              isolation. Cross-user data access attempts return 404.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[rgba(55,50,47,0.08)] shadow-xs space-y-3">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Lock className="size-4" />
            </div>
            <h3 className="text-base font-semibold text-[#37322F]">
              GDPR Data Portability
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Export your full financial history as structured JSON or sanitized
              CSV anytime. Full cascade account deletion with password verification.
            </p>
          </div>
        </div>
      </section>

      {/* Numbers that speak */}
      <section id="metrics" className="w-full max-w-4xl px-4 py-16 border-t border-[rgba(55,50,47,0.08)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <h3 className="font-serif text-3xl sm:text-4xl text-[#37322F] font-normal">
              100%
            </h3>
            <p className="text-xs text-muted-foreground">Integer Minor Units</p>
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-3xl sm:text-4xl text-[#37322F] font-normal">
              &lt; 50ms
            </h3>
            <p className="text-xs text-muted-foreground">Aggregation Query Speed</p>
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-3xl sm:text-4xl text-[#37322F] font-normal">
              Argon2id
            </h3>
            <p className="text-xs text-muted-foreground">Production Password Hashing</p>
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-3xl sm:text-4xl text-[#37322F] font-normal">
              0
            </h3>
            <p className="text-xs text-muted-foreground">External Tracker Cookies</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full max-w-4xl px-4 py-16">
        <div className="rounded-3xl bg-[#37322F] text-white p-8 sm:p-12 text-center space-y-6">
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="font-serif text-3xl sm:text-4xl font-normal">
              Take complete control of your finances today.
            </h2>
            <p className="text-xs sm:text-sm text-white/70">
              Join free in seconds. No credit card required. Free tier forever.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              asChild
              className="h-11 px-8 bg-white text-[#37322F] hover:bg-white/90 rounded-full font-medium text-sm"
            >
              <Link href="/register">Get Started Free</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="h-11 px-6 border-white/20 text-white bg-transparent hover:bg-white/10 rounded-full text-sm"
            >
              <Link href="/login">Sign In with Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-[rgba(55,50,47,0.08)] py-10 px-4 text-xs text-muted-foreground">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded-md bg-[#37322F] text-white flex items-center justify-center font-serif text-xs font-bold">
              A
            </div>
            <span>© {new Date().getFullYear()} Auspify Expense Tracker. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Login
            </Link>
            <Link href="/register" className="hover:text-foreground transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
