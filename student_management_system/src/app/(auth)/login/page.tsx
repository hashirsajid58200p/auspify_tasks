"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(json?.error?.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      const redirectUrl = json?.data?.redirectUrl || "/dashboard";
      router.push(redirectUrl);
    } catch {
      setErrorMessage("Network error: Unable to connect to authentication server.");
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <Card className="shadow-lg border-border">
      <CardHeader className="text-center space-y-2 pb-4">
        <div className="mx-auto h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs">
          <GraduationCap className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold font-display tracking-tight">Sign In</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          EduManage Student Management System
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="p-3 text-xs rounded-md bg-destructive/10 text-destructive flex items-center gap-2 border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold">
              Institutional Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                placeholder="name@school.internal"
                className="pl-9 h-10 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                className="pl-9 h-10 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-10 mt-2 font-medium" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              "Sign In to Portal"
            )}
          </Button>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 pt-2 border-t border-border/50 text-xs">
          <span className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider text-center">
            Demo Credentials (Testing)
          </span>
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-[11px] h-8 justify-center gap-1"
              onClick={() => setDemoCredentials("admin@studentms.internal", "AdminStrongPass123!")}
            >
              <Badge variant="default" className="text-[9px] px-1 py-0">
                ADMIN
              </Badge>
              Admin Demo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-[11px] h-8 justify-center gap-1"
              onClick={() => setDemoCredentials("staff@studentms.internal", "StaffInitialPass123!")}
            >
              <Badge variant="secondary" className="text-[9px] px-1 py-0">
                STAFF
              </Badge>
              Staff Demo
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
