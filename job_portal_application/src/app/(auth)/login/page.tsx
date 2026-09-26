"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LogIn, Lock, Mail, AlertCircle, Loader2, ShieldAlert } from "lucide-react";
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
import { fetchApi, ApiClientError } from "@/lib/api-client";
import { toast } from "sonner";

function LoginForm() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const errorParam = searchParams.get("error");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [generalError, setGeneralError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGeneralError(null);

    try {
      const result = await fetchApi<{ redirectUrl: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      toast.success("Welcome back!");
      const targetUrl = nextParam || result.redirectUrl || "/dashboard";
      window.location.href = targetUrl;
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setGeneralError(err.message);
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
        <div className="w-12 h-12 rounded-2xl bg-[#2F81F7] text-white flex items-center justify-center mx-auto border-2 border-black shadow-neo-sm">
          <LogIn className="w-6 h-6 stroke-[2.5]" />
        </div>
        <CardTitle className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Welcome Back
        </CardTitle>
        <CardDescription>Sign in to access your candidate or employer dashboard.</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {errorParam === "suspended" && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-bold border-2 border-destructive/30">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Your account has been suspended. Please contact platform administration.</span>
            </div>
          )}

          {generalError && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-bold border-2 border-destructive/30">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="you@example.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
            </div>
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
          </div>

          <Button className="w-full rounded-xl mt-2 cursor-pointer" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          {/* Quick Demo Logins */}
          <div className="pt-2">
            <div className="relative flex justify-center text-xs uppercase mb-3">
              <span className="bg-background px-2 text-muted-foreground font-bold tracking-wider">
                Demo Accounts
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@jobportal.local");
                  setPassword("AdminJobPortal123!");
                  setGeneralError(null);
                }}
                className="py-1.5 px-2 text-xs font-bold border-2 border-black rounded-xl bg-[#FFD166] text-black hover:opacity-90 shadow-neo-sm cursor-pointer transition-all active:translate-x-[2px] active:translate-y-[2px]"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("employer@techcorp.local");
                  setPassword("Employer123!");
                  setGeneralError(null);
                }}
                className="py-1.5 px-2 text-xs font-bold border-2 border-black rounded-xl bg-[#06D6A0] text-black hover:opacity-90 shadow-neo-sm cursor-pointer transition-all active:translate-x-[2px] active:translate-y-[2px]"
              >
                Employer
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("seeker@talent.local");
                  setPassword("Seeker123!");
                  setGeneralError(null);
                }}
                className="py-1.5 px-2 text-xs font-bold border-2 border-black rounded-xl bg-[#2F81F7] text-white hover:opacity-90 shadow-neo-sm cursor-pointer transition-all active:translate-x-[2px] active:translate-y-[2px]"
              >
                Seeker
              </button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="justify-center border-t-2 border-black/10 pt-4">
          <p className="text-xs font-bold text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#2F81F7] hover:underline">
              Register here
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
        <Card className="w-full border-3 border-black shadow-neo-lg p-8 text-center text-sm font-bold">
          Loading sign in...
        </Card>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
