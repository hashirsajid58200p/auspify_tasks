"use client";

import * as React from "react";
import Image from "next/image";
import { Building2, Globe, MapPin, Users, Info, Save, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchApi, ApiClientError } from "@/lib/api-client";
import { toast } from "sonner";
import { ALLOWED_LOGO_HOSTS } from "@/validations/company";

interface CompanyData {
  _id?: string;
  name: string;
  website?: string;
  logoUrl?: string;
  description: string;
  location: string;
  industry: string;
  size: "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+";
  slug?: string;
}

export default function EmployerCompanyPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  const [form, setForm] = React.useState<CompanyData>({
    name: "",
    website: "",
    logoUrl: "",
    description: "",
    location: "",
    industry: "",
    size: "11-50",
  });

  React.useEffect(() => {
    async function loadCompany() {
      try {
        const company = await fetchApi<CompanyData | null>("/api/employer/company");
        if (company) {
          setForm({
            name: company.name || "",
            website: company.website || "",
            logoUrl: company.logoUrl || "",
            description: company.description || "",
            location: company.location || "",
            industry: company.industry || "",
            size: company.size || "11-50",
            slug: company.slug,
          });
        }
      } catch (err) {
        console.error("Failed to load company profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCompany();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setGeneralError(null);
    setFieldErrors({});

    try {
      const updated = await fetchApi<CompanyData>("/api/employer/company", {
        method: "PUT",
        body: JSON.stringify(form),
      });

      setForm((prev) => ({ ...prev, ...updated }));
      toast.success("Company profile saved successfully!");
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setGeneralError(err.message);
        if (err.fieldErrors) {
          setFieldErrors(err.fieldErrors);
        }
      } else {
        setGeneralError("An unexpected error occurred while saving.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black/10 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Company Profile</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Configure your public company presence. Complete details are required before publishing
            jobs.
          </p>
        </div>
        {form.slug && (
          <Badge
            variant="outline"
            className="border-2 border-black font-bold self-start sm:self-center"
          >
            Slug: {form.slug}
          </Badge>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {generalError && (
          <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-destructive/10 text-destructive text-sm font-bold border-2 border-destructive/30">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{generalError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Logo & Basic Info */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Company Brand</CardTitle>
              <CardDescription>Logo preview and visual identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="w-28 h-28 mx-auto rounded-3xl border-3 border-black bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden shadow-neo-sm relative">
                {form.logoUrl ? (
                  <Image
                    src={form.logoUrl}
                    alt={form.name || "Company Logo"}
                    fill
                    sizes="112px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <Building2 className="w-12 h-12 text-muted-foreground stroke-1" />
                )}
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Logo URL (https)
                </label>
                <Input
                  placeholder="https://images.unsplash.com/..."
                  value={form.logoUrl || ""}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  disabled={saving}
                />
                {fieldErrors.logoUrl && (
                  <p className="text-xs text-destructive font-bold">{fieldErrors.logoUrl[0]}</p>
                )}
                <p className="text-[11px] text-muted-foreground font-semibold">
                  Allowed hosts: {ALLOWED_LOGO_HOSTS.slice(0, 3).join(", ")}, etc.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Form Fields */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Company Details</CardTitle>
              <CardDescription>All fields are public to candidate applicants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Company Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="Acme Corporation"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    disabled={saving}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-xs text-destructive font-bold">{fieldErrors.name[0]}</p>
                )}
              </div>

              {/* Website */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Official Website (https)
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="https://acme.example.com"
                    value={form.website || ""}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    disabled={saving}
                  />
                </div>
                {fieldErrors.website && (
                  <p className="text-xs text-destructive font-bold">{fieldErrors.website[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    HQ Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      className="pl-10"
                      placeholder="San Francisco, CA"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      required
                      disabled={saving}
                    />
                  </div>
                  {fieldErrors.location && (
                    <p className="text-xs text-destructive font-bold">{fieldErrors.location[0]}</p>
                  )}
                </div>

                {/* Industry */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Industry *
                  </label>
                  <Input
                    placeholder="Technology / FinTech"
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    required
                    disabled={saving}
                  />
                  {fieldErrors.industry && (
                    <p className="text-xs text-destructive font-bold">{fieldErrors.industry[0]}</p>
                  )}
                </div>

                {/* Size */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Company Size *
                  </label>
                  <select
                    className="w-full h-10 px-3 rounded-2xl border-2 border-black bg-background text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                    value={form.size}
                    onChange={(e) =>
                      setForm({ ...form, size: e.target.value as CompanyData["size"] })
                    }
                    disabled={saving}
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Company Overview *
                  </label>
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    {form.description.length} / 2000 chars
                  </span>
                </div>
                <textarea
                  className="w-full min-h-[140px] p-3 rounded-2xl border-2 border-black bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Describe your company culture, mission, team size, and products..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  maxLength={2000}
                  required
                  disabled={saving}
                />
                {fieldErrors.description && (
                  <p className="text-xs text-destructive font-bold">{fieldErrors.description[0]}</p>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full sm:w-auto font-bold gap-2 cursor-pointer"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Company Profile</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
