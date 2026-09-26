"use client";

import * as React from "react";
import {
  User,
  Briefcase,
  FileText,
  MapPin,
  Globe,
  Github,
  Linkedin,
  Save,
  Loader2,
  AlertCircle,
  Plus,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchApi, ApiClientError } from "@/lib/api-client";
import { toast } from "sonner";

interface SeekerProfileData {
  headline?: string;
  bio?: string;
  skills?: string[];
  experienceYears?: number;
  location?: string;
  links?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    resumeUrl?: string;
  };
}

export default function SeekerProfilePage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  const [form, setForm] = React.useState<SeekerProfileData>({
    headline: "",
    bio: "",
    skills: [],
    experienceYears: 0,
    location: "",
    links: {
      linkedin: "",
      github: "",
      portfolio: "",
      resumeUrl: "",
    },
  });

  const [skillInput, setSkillInput] = React.useState("");

  React.useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const profile = await fetchApi<SeekerProfileData | null>("/api/me/profile");
        if (active && profile) {
          setForm({
            headline: profile.headline || "",
            bio: profile.bio || "",
            skills: profile.skills || [],
            experienceYears: profile.experienceYears || 0,
            location: profile.location || "",
            links: {
              linkedin: profile.links?.linkedin || "",
              github: profile.links?.github || "",
              portfolio: profile.links?.portfolio || "",
              resumeUrl: profile.links?.resumeUrl || "",
            },
          });
        }
      } catch (err) {
        if (active) {
          console.error("Failed to load seeker profile:", err);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  function handleAddSkill() {
    const trimmed = skillInput.trim();
    if (!trimmed) return;

    const currentSkills = form.skills || [];
    if (currentSkills.length >= 15) {
      toast.error("Maximum 15 skills allowed.");
      return;
    }

    if (currentSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Skill is already added.");
      return;
    }

    setForm({
      ...form,
      skills: [...currentSkills, trimmed],
    });
    setSkillInput("");
  }

  function handleRemoveSkill(skillToRemove: string) {
    setForm({
      ...form,
      skills: (form.skills || []).filter((s) => s !== skillToRemove),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setGeneralError(null);
    setFieldErrors({});

    try {
      await fetchApi("/api/me/profile", {
        method: "PUT",
        body: JSON.stringify(form),
      });

      toast.success("Profile updated successfully!");
    } catch (err) {
      if (err instanceof ApiClientError) {
        setGeneralError(err.message);
        if (err.fieldErrors) {
          setFieldErrors(err.fieldErrors);
        }
      } else {
        setGeneralError("An unexpected error occurred while saving your profile.");
      }
      toast.error("Failed to save profile. Please check the errors.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#2F81F7]" />
          <p className="text-sm font-bold text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const skillsList = form.skills || [];

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="space-y-2">
        <Badge className="bg-[#2F81F7] text-white border-2 border-black font-bold uppercase text-[11px]">
          Job Seeker Profile
        </Badge>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
          Candidate Profile & Snapshot
        </h1>
        <p className="text-muted-foreground font-medium text-sm md:text-base max-w-2xl leading-relaxed">
          This profile forms the immutable snapshot attached to your job applications. Employers
          will evaluate these credentials when reviewing your submissions.
        </p>
      </div>

      {generalError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border-2 border-red-500 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Editor Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border-3 border-black">
              <CardHeader>
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <User className="w-5 h-5 text-[#2F81F7]" />
                  <span>General Information</span>
                </CardTitle>
                <CardDescription>
                  Your professional headline and brief background summary.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Headline */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Professional Headline
                  </label>
                  <Input
                    value={form.headline || ""}
                    onChange={(e) => setForm({ ...form, headline: e.target.value })}
                    placeholder="e.g. Senior Full Stack Engineer | React, TypeScript & Node.js"
                    maxLength={150}
                    className="border-2 border-black rounded-xl"
                  />
                  <div className="flex justify-between text-[11px] text-muted-foreground font-semibold">
                    <span>A concise title highlighting your core expertise</span>
                    <span>{(form.headline || "").length}/150</span>
                  </div>
                  {fieldErrors.headline && (
                    <p className="text-xs font-bold text-red-500">{fieldErrors.headline[0]}</p>
                  )}
                </div>

                {/* Experience & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                      Years of Experience
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={70}
                      value={form.experienceYears || 0}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          experienceYears: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="border-2 border-black rounded-xl"
                    />
                    {fieldErrors.experienceYears && (
                      <p className="text-xs font-bold text-red-500">
                        {fieldErrors.experienceYears[0]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                      Current Location
                    </label>
                    <Input
                      value={form.location || ""}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="e.g. San Francisco, CA or Remote"
                      maxLength={100}
                      className="border-2 border-black rounded-xl"
                    />
                    {fieldErrors.location && (
                      <p className="text-xs font-bold text-red-500">{fieldErrors.location[0]}</p>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Professional Bio
                  </label>
                  <textarea
                    value={form.bio || ""}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    rows={4}
                    maxLength={2000}
                    placeholder="Tell employers about your impact, architectural choices, and technical strengths..."
                    className="w-full p-3 rounded-xl border-2 border-black bg-background text-sm font-medium focus:outline-hidden resize-y min-h-[100px]"
                  />
                  <div className="flex justify-between text-[11px] text-muted-foreground font-semibold">
                    <span>Plain text only (no raw HTML)</span>
                    <span>{(form.bio || "").length}/2000</span>
                  </div>
                  {fieldErrors.bio && (
                    <p className="text-xs font-bold text-red-500">{fieldErrors.bio[0]}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Skills Card */}
            <Card className="border-3 border-black">
              <CardHeader>
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#FF6B7A]" />
                  <span>Technical & Professional Skills</span>
                </CardTitle>
                <CardDescription>
                  Add up to 15 core skills to showcase to recruiters.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="e.g. React, Next.js, Docker..."
                    maxLength={40}
                    disabled={skillsList.length >= 15}
                    className="border-2 border-black rounded-xl"
                  />
                  <Button
                    type="button"
                    onClick={handleAddSkill}
                    disabled={skillsList.length >= 15 || !skillInput.trim()}
                    className="rounded-xl font-bold border-2 border-black shrink-0"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    <span>Add</span>
                  </Button>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                  <span>Current skills:</span>
                  <span>{skillsList.length}/15</span>
                </div>

                {skillsList.length > 0 ? (
                  <div className="flex flex-wrap gap-2 p-3 bg-neutral-50 dark:bg-neutral-900 border-2 border-black rounded-2xl min-h-[50px] items-center">
                    {skillsList.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-neutral-800 border-2 border-black font-bold text-xs shadow-neo-sm"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-red-500 rounded-full focus:outline-hidden"
                          aria-label={`Remove ${skill}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground font-medium italic">
                    No skills added yet. Add your main technologies above.
                  </p>
                )}

                {fieldErrors.skills && (
                  <p className="text-xs font-bold text-red-500">{fieldErrors.skills[0]}</p>
                )}
              </CardContent>
            </Card>

            {/* Links and Resume */}
            <Card className="border-3 border-black">
              <CardHeader>
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#10B981]" />
                  <span>Resume & Professional Links</span>
                </CardTitle>
                <CardDescription>
                  External https:// URLs where employers can learn more about your work.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Resume URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Hosted Resume / CV URL (https://)</span>
                  </label>
                  <Input
                    value={form.links?.resumeUrl || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        links: { ...form.links, resumeUrl: e.target.value },
                      })
                    }
                    placeholder="https://drive.google.com/... or https://yourdomain.com/resume.pdf"
                    className="border-2 border-black rounded-xl"
                  />
                  {fieldErrors["links.resumeUrl"] && (
                    <p className="text-xs font-bold text-red-500">
                      {fieldErrors["links.resumeUrl"][0]}
                    </p>
                  )}
                </div>

                {/* LinkedIn */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Linkedin className="w-3.5 h-3.5 text-[#2F81F7]" />
                    <span>LinkedIn Profile (https://)</span>
                  </label>
                  <Input
                    value={form.links?.linkedin || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        links: { ...form.links, linkedin: e.target.value },
                      })
                    }
                    placeholder="https://linkedin.com/in/username"
                    className="border-2 border-black rounded-xl"
                  />
                  {fieldErrors["links.linkedin"] && (
                    <p className="text-xs font-bold text-red-500">
                      {fieldErrors["links.linkedin"][0]}
                    </p>
                  )}
                </div>

                {/* GitHub */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub Profile (https://)</span>
                  </label>
                  <Input
                    value={form.links?.github || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        links: { ...form.links, github: e.target.value },
                      })
                    }
                    placeholder="https://github.com/username"
                    className="border-2 border-black rounded-xl"
                  />
                  {fieldErrors["links.github"] && (
                    <p className="text-xs font-bold text-red-500">
                      {fieldErrors["links.github"][0]}
                    </p>
                  )}
                </div>

                {/* Portfolio Website */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#FFC224]" />
                    <span>Portfolio Website (https://)</span>
                  </label>
                  <Input
                    value={form.links?.portfolio || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        links: { ...form.links, portfolio: e.target.value },
                      })
                    }
                    placeholder="https://myportfolio.dev"
                    className="border-2 border-black rounded-xl"
                  />
                  {fieldErrors["links.portfolio"] && (
                    <p className="text-xs font-bold text-red-500">
                      {fieldErrors["links.portfolio"][0]}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl py-6 font-black text-base shadow-neo flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Profile</span>
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Live Snapshot Preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Employer Live Snapshot Preview
            </span>
            <Badge variant="outline" className="border-2 border-black text-[10px] font-bold">
              Read-Only View
            </Badge>
          </div>

          <div className="bg-white dark:bg-[#191919] border-3 border-black rounded-3xl p-6 shadow-neo space-y-5">
            <div className="space-y-1 border-b-2 border-black/10 dark:border-white/10 pb-4">
              <h3 className="font-black text-xl leading-tight">
                {form.headline || "Professional Headline Preview"}
              </h3>
              <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {form.location || "Location not set"}
                </span>
                <span>•</span>
                <span>{form.experienceYears || 0} years exp</span>
              </div>
            </div>

            {form.bio && (
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  Candidate Bio
                </span>
                <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed font-medium whitespace-pre-wrap">
                  {form.bio}
                </p>
              </div>
            )}

            {skillsList.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  Skills ({skillsList.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {skillsList.map((skill) => (
                    <span
                      key={skill}
                      className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-black/30"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t-2 border-black/10 dark:border-white/10 space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground block">
                Verified Links
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                {form.links?.resumeUrl && (
                  <a
                    href={form.links.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#2F81F7] font-bold hover:underline"
                  >
                    <span>View Resume</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {form.links?.github && (
                  <a
                    href={form.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold hover:underline"
                  >
                    <span>GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {form.links?.linkedin && (
                  <a
                    href={form.links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold hover:underline"
                  >
                    <span>LinkedIn</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {form.links?.portfolio && (
                  <a
                    href={form.links.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold hover:underline"
                  >
                    <span>Portfolio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {!form.links?.resumeUrl &&
                  !form.links?.github &&
                  !form.links?.linkedin &&
                  !form.links?.portfolio && (
                    <span className="text-xs text-muted-foreground italic">No links added</span>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
