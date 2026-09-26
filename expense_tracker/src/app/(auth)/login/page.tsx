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
import { Badge } from "@/components/ui/badge";
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

  const handleFillDemo = (autoSubmit = false) => {
    setEmail("demo@auspify.com");
    setPassword("DemoUser1234!");
    setGeneralError(null);
    setFieldErrors({});

    if (autoSubmit) {
      setTimeout(() => {
        executeLogin("demo@auspify.com", "DemoUser1234!");
      }, 50);
    }
  };

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    setLoading(true);
    setGeneralError(null);
    setFieldErrors({});

    try {
      await fetchApi("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: loginEmail.trim().toLowerCase(),
          password: loginPass,
        }),
      });

      window.location.href = nextUrl;
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
    <Card className="border border-border/60 shadow-lg bg-card/95 backdrop-blur">
      <CardHeader className="space-y-1 text-center sm:text-left">
        <CardTitle className="font-serif text-2xl tracking-tight">Sign In</CardTitle>
        <CardDescription>
          Enter your email and password to access your dashboard
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <CardContent className="space-y-4">
          {generalError && (
            <div className="flex items-start gap-2.5 p-3 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <p className="text-xs text-destructive">{fieldErrors.email[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
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
                className="pr-10"
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

        <CardFooter className="flex flex-col gap-4 pt-2">
          <Button
            type="submit"
            className="w-full h-11 text-base font-medium shadow-sm transition-all"
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

          {/* Quick Demo Credentials Fill */}
          <div className="w-full pt-3 border-t border-border/60 space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
              Quick Demo Fill
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full text-xs h-9 justify-center gap-2"
              onClick={() => handleFillDemo(false)}
            >
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                DEMO
              </Badge>
              <span className="font-medium">Demo User</span>
              <span className="text-muted-foreground text-[11px]">(demo@auspify.com)</span>
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href={`/register${nextUrl !== "/dashboard" ? `?next=${encodeURIComponent(nextUrl)}` : ""}`}
              className="text-primary font-medium hover:underline underline-offset-4"
            >
              Sign up
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
        <Card className="border border-border/60 shadow-lg bg-card/95 p-8 text-center text-sm text-muted-foreground">
          Loading sign in...
        </Card>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
