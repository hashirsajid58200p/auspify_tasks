"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  Users,
  Eye,
  XCircle,
  RotateCcw,
  Archive,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fetchApi, ApiClientError } from "@/lib/api-client";
import { toast } from "sonner";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface JobDetail {
  _id: string;
  title: string;
  slug: string;
  description: string;
  categoryId: { _id: string; name: string } | string;
  type: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
  locationType: "ONSITE" | "REMOTE" | "HYBRID";
  location: string;
  experienceLevel: "ENTRY" | "MID" | "SENIOR" | "LEAD" | "EXECUTIVE";
  skills: string[];
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
  applicationCount: number;
  viewCount: number;
}

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [categories, setCategories] = React.useState<CategoryOption[]>([]);
  const [job, setJob] = React.useState<JobDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
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
  const [salaryMin, setSalaryMin] = React.useState<number>(0);
  const [salaryMax, setSalaryMax] = React.useState<number>(0);
  const [salaryCurrency, setSalaryCurrency] = React.useState("USD");
  const [description, setDescription] = React.useState("");
  const [skills, setSkills] = React.useState<string[]>([]);
  const [skillInput, setSkillInput] = React.useState("");

  const reloadJob = React.useCallback(async () => {
    try {
      const jobRes = await fetchApi<JobDetail>(`/api/employer/jobs/${jobId}`);
      if (jobRes) {
        setJob(jobRes);
      }
    } catch {
      // ignore reload error
    }
  }, [jobId]);

  React.useEffect(() => {
    let active = true;
    async function init() {
      try {
        const [catsRes, jobRes] = await Promise.all([
          fetchApi<CategoryOption[]>("/api/categories"),
          fetchApi<JobDetail>(`/api/employer/jobs/${jobId}`),
        ]);

        if (!active) return;
        if (catsRes) setCategories(catsRes);
        if (jobRes) {
          setJob(jobRes);
          setTitle(jobRes.title);
          const catId =
            typeof jobRes.categoryId === "object" ? jobRes.categoryId._id : jobRes.categoryId;
          setCategoryId(catId || "");
          setType(jobRes.type);
          setLocationType(jobRes.locationType);
          setLocation(jobRes.location);
          setExperienceLevel(jobRes.experienceLevel);
          setSalaryMin(jobRes.salaryMin);
          setSalaryMax(jobRes.salaryMax);
          setSalaryCurrency(jobRes.salaryCurrency);
          setDescription(jobRes.description);
          setSkills(jobRes.skills || []);
        }
      } catch (err: unknown) {
        if (!active) return;
        if (err instanceof ApiClientError && err.status === 404) {
          toast.error("Job listing not found");
          router.push("/employer/jobs");
        } else {
          toast.error("Failed to load job details");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    init();
    return () => {
      active = false;
    };
  }, [jobId, router]);

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

  const handleSave = async () => {
    setSubmitting(true);
    setGeneralError(null);
    setFieldErrors({});

    try {
      const updated = await fetchApi<JobDetail>(`/api/employer/jobs/${jobId}`, {
        method: "PATCH",
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

      setJob(updated);
      toast.success("Job updated successfully!");
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
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (
    action: "publish" | "close" | "reopen" | "archive" | "delete",
  ) => {
    setSubmitting(true);
    try {
      if (action === "delete") {
        if (!confirm("Are you sure you want to delete this listing?")) {
          setSubmitting(false);
          return;
        }
        await fetchApi(`/api/employer/jobs/${jobId}`, { method: "DELETE" });
        toast.success("Job deleted successfully");
        router.push("/employer/jobs");
        return;
      }

      await fetchApi(`/api/employer/jobs/${jobId}/${action}`, { method: "POST" });
      toast.success(`Job marked as ${action === "publish" ? "published" : action}`);
      await reloadJob();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Operation failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Edit Job Listing</h1>
            <Badge
              className={`border-2 border-black font-extrabold text-[11px] ${
                job.status === "PUBLISHED"
                  ? "bg-[#06D6A0] text-black"
                  : job.status === "DRAFT"
                    ? "bg-[#FFD166] text-black"
                    : "bg-neutral-200 text-black"
              }`}
            >
              {job.status}
            </Badge>
          </div>
          <p className="text-xs font-semibold text-muted-foreground">
            Slug: {job.slug} • {job.applicationCount} Applicants • {job.viewCount} Views
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {job.status === "DRAFT" && (
            <Button
              type="button"
              size="sm"
              className="bg-[#06D6A0] text-black hover:bg-[#05b587] border-2 border-black font-bold gap-1.5 shadow-neo-sm cursor-pointer"
              onClick={() => handleStatusChange("publish")}
              disabled={submitting}
            >
              <Rocket className="w-4 h-4" />
              <span>Publish</span>
            </Button>
          )}

          {job.status === "PUBLISHED" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-2 border-black font-bold gap-1.5 cursor-pointer"
              onClick={() => handleStatusChange("close")}
              disabled={submitting}
            >
              <XCircle className="w-4 h-4 text-[#FFD166]" />
              <span>Close</span>
            </Button>
          )}

          {job.status === "CLOSED" && (
            <Button
              type="button"
              size="sm"
              className="bg-[#06D6A0] text-black border-2 border-black font-bold gap-1.5 cursor-pointer shadow-neo-sm"
              onClick={() => handleStatusChange("reopen")}
              disabled={submitting}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reopen</span>
            </Button>
          )}

          {job.status !== "ARCHIVED" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-2 border-black font-bold gap-1.5 cursor-pointer"
              onClick={() => handleStatusChange("archive")}
              disabled={submitting}
            >
              <Archive className="w-4 h-4" />
              <span>Archive</span>
            </Button>
          )}

          {job.applicationCount === 0 && (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="border-2 border-black font-bold gap-1.5 cursor-pointer"
              onClick={() => handleStatusChange("delete")}
              disabled={submitting}
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </Button>
          )}

          <Button asChild variant="outline" className="border-2 border-black font-bold">
            <Link href="/employer/jobs">Back to Jobs</Link>
          </Button>
        </div>
      </div>

      {generalError && (
        <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-destructive/10 text-destructive text-sm font-bold border-2 border-destructive/30">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-extrabold">{job.applicationCount}</div>
          <div className="text-xs font-semibold text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>Applications</span>
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-extrabold">{job.viewCount}</div>
          <div className="text-xs font-semibold text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>Impressions</span>
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-extrabold">{job.type.replace("_", " ")}</div>
          <div className="text-xs font-semibold text-muted-foreground mt-0.5">Commitment</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-extrabold">{job.locationType}</div>
          <div className="text-xs font-semibold text-muted-foreground mt-0.5">Work Model</div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Specification</CardTitle>
          <CardDescription>
            Update role requirements, compensation, and responsibilities
          </CardDescription>
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
                  placeholder="Type a skill and press Enter"
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

          <div className="pt-3">
            <Button
              type="button"
              size="lg"
              className="font-bold gap-2 cursor-pointer shadow-neo-sm"
              onClick={handleSave}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Changes</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
