"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  DollarSign,
  MapPin,
  Tag,
  X,
  Plus,
  Save,
  Rocket,
  Loader2,
  AlertCircle,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fetchApi, ApiClientError } from "@/lib/api-client";
import { toast } from "sonner";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export default function NewJobPage() {
  const router = useRouter();

  const [categories, setCategories] = React.useState<CategoryOption[]>([]);
  const [hasCompany, setHasCompany] = React.useState<boolean | null>(null);
  const [loadingInitial, setLoadingInitial] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  // Form State
  const [title, setTitle] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [type, setType] = React.useState<"FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP">(
    "FULL_TIME",
  );
  const [locationType, setLocationType] = React.useState<"ONSITE" | "REMOTE" | "HYBRID">("REMOTE");
  const [location, setLocation] = React.useState("");
  const [experienceLevel, setExperienceLevel] = React.useState<
    "ENTRY" | "MID" | "SENIOR" | "LEAD" | "EXECUTIVE"
  >("MID");
  const [salaryMin, setSalaryMin] = React.useState<number>(80000);
  const [salaryMax, setSalaryMax] = React.useState<number>(120000);
  const [salaryCurrency, setSalaryCurrency] = React.useState("USD");
  const [description, setDescription] = React.useState("");

  // Skills Tag State
  const [skills, setSkills] = React.useState<string[]>(["TypeScript", "React"]);
  const [skillInput, setSkillInput] = React.useState("");

  React.useEffect(() => {
    async function loadData() {
      try {
        const [catsRes, companyRes] = await Promise.allSettled([
          fetchApi<CategoryOption[]>("/api/categories"),
          fetchApi<{ name?: string }>("/api/employer/company"),
        ]);

        if (catsRes.status === "fulfilled" && catsRes.value) {
          setCategories(catsRes.value);
          if (catsRes.value.length > 0) {
            setCategoryId(catsRes.value[0].id);
          }
        }

        if (companyRes.status === "fulfilled" && companyRes.value && companyRes.value.name) {
          setHasCompany(true);
        } else {
          setHasCompany(false);
        }
      } catch (err) {
        console.error("Failed to load initial data:", err);
      } finally {
        setLoadingInitial(false);
      }
    }

    loadData();
  }, []);

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) {
      setSkillInput("");
      return;
    }
    if (skills.length >= 15) {
      toast.error("Maximum 15 skills allowed");
      return;
    }
    setSkills([...skills, trimmed]);
    setSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleKeyDownSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleSubmit = async (publishImmediately: boolean) => {
    setSubmitting(true);
    setGeneralError(null);
    setFieldErrors({});

    try {
      const created = await fetchApi<{ _id: string }>("/api/employer/jobs", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          categoryId,
          type,
          locationType,
          location: location.trim(),
          experienceLevel,
          salaryMin: Number(salaryMin),
          salaryMax: Number(salaryMax),
          salaryCurrency: salaryCurrency.trim().toUpperCase(),
          skills,
          description: description.trim(),
        }),
      });

      if (publishImmediately) {
        try {
          await fetchApi(`/api/employer/jobs/${created._id}/publish`, { method: "POST" });
          toast.success("Job created and published successfully!");
        } catch {
          toast.warning(
            "Job created as draft, but could not be published yet. Please verify prerequisites.",
          );
        }
      } else {
        toast.success("Job created as draft!");
      }

      router.push("/employer/jobs");
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
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black/10 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Create Job Listing</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Specify requirements, compensation, and experience level for your open role.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="border-2 border-black font-bold self-start sm:self-center"
        >
          <Link href="/employer/jobs">Back to Jobs</Link>
        </Button>
      </div>

      {hasCompany === false && (
        <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#FFD166]/20 border-2 border-black text-black">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-extrabold text-sm">Company Profile Incomplete</h2>
              <p className="text-xs font-semibold text-black/80 mt-0.5">
                You must configure your company profile before publishing listings to candidates.
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="font-bold border-2 border-black shrink-0">
            <Link href="/employer/company">Setup Company</Link>
          </Button>
        </div>
      )}

      {generalError && (
        <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-destructive/10 text-destructive text-sm font-bold border-2 border-destructive/30">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Role Details</CardTitle>
          <CardDescription>Primary job information visible in catalog and search</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Job Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Job Title *
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Senior Full Stack Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            {fieldErrors.title && (
              <p className="text-xs text-destructive font-bold">{fieldErrors.title[0]}</p>
            )}
          </div>

          {/* Category & Employment Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Job Category *
              </label>
              <select
                className="w-full h-10 px-3 rounded-2xl border-2 border-black bg-background text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={submitting}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Employment Type *
              </label>
              <select
                className="w-full h-10 px-3 rounded-2xl border-2 border-black bg-background text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                disabled={submitting}
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>
          </div>

          {/* Location Type, Location, Experience Level */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Workplace Model *
              </label>
              <select
                className="w-full h-10 px-3 rounded-2xl border-2 border-black bg-background text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                value={locationType}
                onChange={(e) => setLocationType(e.target.value as typeof locationType)}
                disabled={submitting}
              >
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ONSITE">On-Site</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="San Francisco, CA or Worldwide"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
              {fieldErrors.location && (
                <p className="text-xs text-destructive font-bold">{fieldErrors.location[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Experience Level *
              </label>
              <select
                className="w-full h-10 px-3 rounded-2xl border-2 border-black bg-background text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as typeof experienceLevel)}
                disabled={submitting}
              >
                <option value="ENTRY">Entry Level</option>
                <option value="MID">Mid Level</option>
                <option value="SENIOR">Senior Level</option>
                <option value="LEAD">Lead / Architect</option>
                <option value="EXECUTIVE">Executive / VP</option>
              </select>
            </div>
          </div>

          {/* Salary Compensation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Min Annual Salary *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  className="pl-10"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(Number(e.target.value))}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Max Annual Salary *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  className="pl-10"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(Number(e.target.value))}
                  required
                  disabled={submitting}
                />
              </div>
              {fieldErrors.salaryMax && (
                <p className="text-xs text-destructive font-bold">{fieldErrors.salaryMax[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Currency
              </label>
              <Input
                placeholder="USD"
                maxLength={3}
                value={salaryCurrency}
                onChange={(e) => setSalaryCurrency(e.target.value.toUpperCase())}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Skills Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Required Skills (max 15) *
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Type a skill and press Enter (e.g. Next.js, Docker)"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleKeyDownSkill}
                  disabled={submitting || skills.length >= 15}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddSkill}
                className="border-2 border-black font-bold gap-1 cursor-pointer"
                disabled={submitting || !skillInput.trim() || skills.length >= 15}
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-xs font-bold border-2 border-black"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-destructive cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
            {fieldErrors.skills && (
              <p className="text-xs text-destructive font-bold">{fieldErrors.skills[0]}</p>
            )}
          </div>

          {/* Job Description */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Job Description *
              </label>
              <span className="text-[11px] text-muted-foreground font-semibold">
                {description.length} / 5000 chars
              </span>
            </div>
            <textarea
              className="w-full min-h-[180px] p-3 rounded-2xl border-2 border-black bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Outline responsibilities, tech stack, benefits, qualifications..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
              required
              disabled={submitting}
            />
            {fieldErrors.description && (
              <p className="text-xs text-destructive font-bold">{fieldErrors.description[0]}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="border-2 border-black font-bold gap-2 cursor-pointer"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save as Draft</span>
            </Button>

            <Button
              type="button"
              size="lg"
              className="bg-[#06D6A0] text-black hover:bg-[#05b587] border-2 border-black font-extrabold gap-2 cursor-pointer shadow-neo-sm"
              onClick={() => handleSubmit(true)}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Rocket className="w-4 h-4" />
              )}
              <span>Publish Listing</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
