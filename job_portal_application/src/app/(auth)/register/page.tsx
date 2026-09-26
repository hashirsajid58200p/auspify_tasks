"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  UserPlus,
  Lock,
  Mail,
  User,
  Briefcase,
  Building2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { fetchApi, ApiClientError } from "@/lib/api-client";
import { toast } from "sonner";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");

  const [selectedRole, setSelectedRole] = React.useState<"JOB_SEEKER" | "EMPLOYER">("JOB_SEEKER");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGeneralError(null);
    setFieldErrors({});

    try {
      const result = await fetchApi<{ redirectUrl: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: selectedRole,
        }),
      });

      toast.success("Account created successfully!");
      const targetUrl = nextParam || result.redirectUrl || "/dashboard";
      window.location.href = targetUrl;
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setGeneralError(err.message);
        if (err.fieldErrors) {
          setFieldErrors(err.fieldErrors);
        }
      } else {
        setGeneralError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full border-3 border-black shadow-neo-lg">
      <CardHeader className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#FF6B7A] text-white flex items-center justify-center mx-auto border-2 border-black shadow-neo-sm">
          <UserPlus className="w-6 h-6 stroke-[2.5]" />
        </div>
        <CardTitle className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Create Your Account
        </CardTitle>
        <CardDescription>Join as a job candidate or verified employer.</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {generalError && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-bold border-2 border-destructive/30">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Role Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              I am joining as:
            </label>
            <div className="grid grid-cols-2 gap-2.5 p-1 bg-neutral-100 dark:bg-neutral-900 border-2 border-black rounded-2xl">
              <button
                type="button"
                onClick={() => setSelectedRole("JOB_SEEKER")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  selectedRole === "JOB_SEEKER"
                    ? "bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white shadow-neo-sm"
                    : "text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800",
                )}
              >
                <Briefcase className="w-4 h-4" />
                <span>Job Seeker</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("EMPLOYER")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  selectedRole === "EMPLOYER"
                    ? "bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white shadow-neo-sm"
                    : "text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800",
                )}
              >
                <Building2 className="w-4 h-4" />
                <span>Employer</span>
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Jane Doe"
                className="pl-10"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {fieldErrors.name && (
              <p className="text-xs text-destructive font-bold">{fieldErrors.name[0]}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="jane@example.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-xs text-destructive font-bold">{fieldErrors.email[0]}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Password (min 8 characters)
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="••••••••"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-destructive font-bold">{fieldErrors.password[0]}</p>
            )}
          </div>

          <Button className="w-full rounded-xl mt-2 cursor-pointer" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </CardContent>

        <CardFooter className="justify-center border-t-2 border-black/10 pt-4">
          <p className="text-xs font-bold text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-[#2F81F7] hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense
      fallback={
        <Card className="w-full border-3 border-black shadow-neo-lg p-8 text-center text-sm font-bold">
          Loading registration...
        </Card>
      }
    >
      <RegisterForm />
    </React.Suspense>
  );
}
