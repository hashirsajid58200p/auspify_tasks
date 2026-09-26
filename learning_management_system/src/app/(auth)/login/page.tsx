"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { fetchApi, ApiClientError } from "@/lib/api-client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    setLoading(true);
    setGeneralError(null);
    setFieldErrors({});

    try {
      const result = await fetchApi<{ redirectUrl?: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: loginEmail.trim().toLowerCase(),
          password: loginPass,
        }),
      });

      const explicitNext = searchParams.get("next");
      const targetDestination =
        explicitNext && explicitNext !== "/dashboard" && explicitNext !== "/"
          ? explicitNext
          : result?.redirectUrl || "/dashboard";

      window.location.href = targetDestination;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(email, password);
  };

  return (
    <Card className="border border-border/80 shadow-xl bg-card rounded-2xl">
      <CardHeader className="space-y-1 text-center sm:text-left">
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          Sign In
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-muted-foreground">
          Enter your email and password to access your learning portal
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <CardContent className="space-y-4">
          {generalError && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 text-destructive text-xs sm:text-sm border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
              className="h-10 rounded-xl text-xs sm:text-sm"
            />
            {fieldErrors.email && (
              <p className="text-xs text-destructive">{fieldErrors.email[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-medium">
                Password
              </Label>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
                className="h-10 rounded-xl pr-10 text-xs sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-destructive">{fieldErrors.password[0]}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-1">
          <Button
            type="submit"
            className="w-full h-10 text-sm font-semibold rounded-xl shadow-md transition-all"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          {/* 1-Click Demo Login Autofill */}
          <div className="w-full pt-3 border-t border-border/60 space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
              Quick Demo Fill
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-[11px] rounded-xl h-8 px-2"
                onClick={() => {
                  setEmail("student@lms.local");
                  setPassword("StudentDemo123!");
                  setGeneralError(null);
                }}
              >
                Student
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-[11px] rounded-xl h-8 px-2"
                onClick={() => {
                  setEmail("instructor@lms.local");
                  setPassword("InstructorDemo123!");
                  setGeneralError(null);
                }}
              >
                Instructor
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-[11px] rounded-xl h-8 px-2"
                onClick={() => {
                  setEmail("admin@lms.local");
                  setPassword("AdminDemo123!");
                  setGeneralError(null);
                }}
              >
                Admin
              </Button>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href={`/register${nextUrl !== "/dashboard" ? `?next=${encodeURIComponent(nextUrl)}` : ""}`}
              className="text-primary font-semibold hover:underline underline-offset-4"
            >
              Sign up as Student
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <Card className="border border-border/80 shadow-lg bg-card p-8 text-center text-sm text-muted-foreground rounded-2xl">
          Loading sign in...
        </Card>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
