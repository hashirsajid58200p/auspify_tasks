import Link from "next/link";
import { Briefcase, Github, Linkedin, Twitter, ShieldCheck } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="bg-black text-white border-t-4 border-black mt-20 pt-16 pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand & Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white text-black rounded-xl border-2 border-white flex items-center justify-center font-bold">
                <Briefcase className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-2xl font-bold tracking-tight">
                Job
                <span className="bg-[#2F81F7] text-white px-2 py-0.5 rounded-md text-base uppercase">
                  Portal
                </span>
              </span>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-sm">
              A high-integrity employment platform connecting qualified talent with verified
              employers through transparent status workflows.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-[#2F81F7] flex items-center justify-center hover:opacity-85 transition-opacity"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4 text-white" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-[#FF6B7A] flex items-center justify-center hover:opacity-85 transition-opacity"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4 text-white" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-[#FFC224] flex items-center justify-center hover:opacity-85 transition-opacity"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4 text-black" />
              </a>
            </div>
          </div>

          {/* Candidates */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
              For Job Seekers
            </h3>
            <ul className="space-y-2.5 text-sm text-neutral-400 font-medium">
              <li>
                <Link href="/jobs" className="hover:text-white transition-colors">
                  Explore Jobs
                </Link>
              </li>
              <li>
                <Link href="/companies" className="hover:text-white transition-colors">
                  Browse Companies
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Build Seeker Profile
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Track Applications
                </Link>
              </li>
            </ul>
          </div>

          {/* Employers */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
              For Employers
            </h3>
            <ul className="space-y-2.5 text-sm text-neutral-400 font-medium">
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Create Company Account
                </Link>
              </li>
              <li>
                <Link href="/employer/jobs/new" className="hover:text-white transition-colors">
                  Post a Job Listing
                </Link>
              </li>
              <li>
                <Link href="/employer" className="hover:text-white transition-colors">
                  Applicant Pipeline
                </Link>
              </li>
              <li>
                <Link href="/employer/company" className="hover:text-white transition-colors">
                  Company Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Compliance & Trust */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
              Trust & Legal
            </h3>
            <ul className="space-y-2.5 text-sm text-neutral-400 font-medium">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li className="flex items-center gap-1.5 text-neutral-300 pt-2 font-semibold">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                <span>Verified State Machine</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-medium">
          <p>
            © {new Date().getFullYear()} Job Portal Application. Auspify Internship Task 5
            (Advanced).
          </p>
          <p>Strictly No Mock Data • Powered by MongoDB Atlas & Next.js 16</p>
        </div>
      </div>
    </footer>
  );
}
