"use client";

import * as React from "react";
import Link from "next/link";
import {
  Briefcase,
  PlusCircle,
  Eye,
  Users,
  Clock,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Archive,
  RotateCcw,
  Trash2,
  Edit,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchApi, ApiClientError } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface JobItem {
  _id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
  type: string;
  locationType: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  applicationCount: number;
  viewCount: number;
  createdAt: string;
  categoryId?: {
    _id: string;
    name: string;
  };
}

export default function EmployerJobsPage() {
  const [activeTab, setActiveTab] = React.useState<
    "ALL" | "PUBLISHED" | "DRAFT" | "CLOSED" | "ARCHIVED"
  >("ALL");
  const [jobs, setJobs] = React.useState<JobItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const loadJobs = React.useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      try {
        const url = `/api/employer/jobs?status=${activeTab}&limit=50`;
        const res = await fetchApi<any>(url);
        const list = Array.isArray(res) ? res : res?.data || [];
        setJobs(list);
      } catch (err) {
        console.error("Failed to load jobs:", err);
        toast.error("Failed to fetch listings");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [activeTab],
  );

  React.useEffect(() => {
    let active = true;
    async function init() {
      try {
        const url = `/api/employer/jobs?status=${activeTab}&limit=50`;
        const res = await fetchApi<any>(url);
        const list = Array.isArray(res) ? res : res?.data || [];
        if (active) setJobs(list);
      } catch (err) {
        if (active) {
          console.error("Failed to load jobs:", err);
          toast.error("Failed to fetch listings");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [activeTab]);

  const handleAction = async (
    jobId: string,
    action: "publish" | "close" | "reopen" | "archive" | "delete",
  ) => {
    setActionLoading(jobId);
    try {
      if (action === "delete") {
        if (!confirm("Are you sure you want to delete this job listing? This cannot be undone.")) {
          setActionLoading(null);
          return;
        }
        await fetchApi(`/api/employer/jobs/${jobId}`, { method: "DELETE" });
        toast.success("Job deleted successfully");
      } else {
        await fetchApi(`/api/employer/jobs/${jobId}/${action}`, { method: "POST" });
        toast.success(`Job marked as ${action === "publish" ? "published" : action}`);
      }
      await loadJobs();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("An error occurred during operation");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: JobItem["status"]) => {
    switch (status) {
      case "PUBLISHED":
        return (
          <Badge className="bg-[#06D6A0] text-black border-2 border-black font-extrabold text-[11px]">
            Active
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge className="bg-[#FFD166] text-black border-2 border-black font-extrabold text-[11px]">
            Draft
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge className="bg-neutral-300 text-black border-2 border-black font-extrabold text-[11px]">
            Closed
          </Badge>
        );
      case "ARCHIVED":
        return (
          <Badge className="bg-neutral-800 text-white border-2 border-black font-extrabold text-[11px]">
            Archived
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black/10 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Manage Job Listings
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Oversee your active openings, drafts, applicant funnels, and status lifecycles.
          </p>
        </div>
        <Button asChild size="lg" className="font-bold gap-2 self-start sm:self-center">
          <Link href="/employer/jobs/new">
            <PlusCircle className="w-5 h-5" />
            <span>Post New Job</span>
          </Link>
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-neutral-100 dark:bg-neutral-900 border-2 border-black rounded-2xl w-fit">
        {(["ALL", "PUBLISHED", "DRAFT", "CLOSED", "ARCHIVED"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeTab === tab
                ? "bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white shadow-neo-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : jobs.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div className="w-16 h-16 rounded-full border-2 border-black bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-bold">No {activeTab.toLowerCase()} listings found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                {activeTab === "ALL"
                  ? "Get started by publishing your first job listing to attract qualified talent."
                  : `You have no listings currently in ${activeTab.toLowerCase()} status.`}
              </p>
            </div>
            <Button asChild className="font-bold gap-2">
              <Link href="/employer/jobs/new">
                <PlusCircle className="w-4 h-4" />
                <span>Create New Job</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job._id} className="hover:shadow-neo transition-all">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Job Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(job.status)}
                      <span className="text-xs font-bold text-muted-foreground uppercase">
                        {job.categoryId?.name || "General"}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {job.type.replace("_", " ")}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {job.location} ({job.locationType})
                      </span>
                    </div>

                    <h2 className="text-lg md:text-xl font-extrabold tracking-tight hover:text-primary">
                      <Link href={`/employer/jobs/${job._id}/edit`}>{job.title}</Link>
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-muted-foreground pt-1">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        <strong>{job.applicationCount}</strong> Applicants
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4" />
                        <strong>{job.viewCount}</strong> Views
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Created {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                      <span>
                        ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}{" "}
                        {job.salaryCurrency}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="font-bold border-2 border-black gap-1.5"
                    >
                      <Link href={`/employer/jobs/${job._id}/edit`}>
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </Link>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-2 border-black px-2 cursor-pointer"
                          disabled={actionLoading === job._id}
                        >
                          {actionLoading === job._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <MoreVertical className="w-4 h-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-44 border-2 border-black font-semibold"
                      >
                        {job.status === "DRAFT" && (
                          <DropdownMenuItem
                            onClick={() => handleAction(job._id, "publish")}
                            className="cursor-pointer gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4 text-[#06D6A0]" />
                            <span>Publish Job</span>
                          </DropdownMenuItem>
                        )}

                        {job.status === "PUBLISHED" && (
                          <DropdownMenuItem
                            onClick={() => handleAction(job._id, "close")}
                            className="cursor-pointer gap-2"
                          >
                            <XCircle className="w-4 h-4 text-[#FFD166]" />
                            <span>Close Listing</span>
                          </DropdownMenuItem>
                        )}

                        {job.status === "CLOSED" && (
                          <DropdownMenuItem
                            onClick={() => handleAction(job._id, "reopen")}
                            className="cursor-pointer gap-2"
                          >
                            <RotateCcw className="w-4 h-4 text-[#06D6A0]" />
                            <span>Reopen Listing</span>
                          </DropdownMenuItem>
                        )}

                        {job.status !== "ARCHIVED" && (
                          <DropdownMenuItem
                            onClick={() => handleAction(job._id, "archive")}
                            className="cursor-pointer gap-2 text-muted-foreground"
                          >
                            <Archive className="w-4 h-4" />
                            <span>Archive Job</span>
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator className="bg-black/10" />

                        {job.applicationCount === 0 ? (
                          <DropdownMenuItem
                            onClick={() => handleAction(job._id, "delete")}
                            className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Job</span>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                            Cannot delete (has applicants)
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
