"use client";

import * as React from "react";
import Link from "next/link";
import {
  Shield,
  Search,
  Loader2,
  RefreshCw,
  Archive,
  FileEdit,
  ExternalLink,
  Eye,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchApi } from "@/lib/api-client";
import { toast } from "sonner";

interface AdminJobItem {
  _id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
  location: string;
  type: string;
  viewCount: number;
  applicationCount: number;
  createdAt: string;
  employerId?: {
    _id: string;
    name: string;
    email: string;
  };
  companyId?: {
    _id: string;
    name: string;
    slug: string;
  };
  categoryId?: {
    _id: string;
    name: string;
  };
}

export function JobsModeration() {
  const [jobs, setJobs] = React.useState<AdminJobItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("q", search.trim());
        if (statusFilter) params.set("status", statusFilter);
        params.set("page", page.toString());
        params.set("limit", "15");

        const res = await fetchApi<{
          data: AdminJobItem[];
          meta: { total: number; totalPages: number; page: number };
        }>(`/api/admin/jobs?${params.toString()}`);

        if (isMounted) {
          const list = Array.isArray(res) ? res : res?.data || [];
          setJobs(list);
          if (res && "meta" in res && res.meta) {
            setTotalPages(res.meta.totalPages || 1);
            setTotal(res.meta.total || list.length);
          } else {
            setTotal(list.length);
          }
        }
      } catch (err: any) {
        if (isMounted) toast.error(err.message || "Failed to load jobs");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [search, statusFilter, page, refreshKey]);

  async function handleModerate(jobId: string, action: "unpublish" | "archive") {
    setActionLoadingId(jobId);
    try {
      await fetchApi(`/api/admin/jobs/${jobId}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      toast.success(
        `Job ${action === "unpublish" ? "unpublished to DRAFT" : "archived"} successfully. Category counter synced.`,
      );
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to moderate job");
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge className="bg-[#2F81F7] text-white border-2 border-black font-bold uppercase text-[11px]">
            Content Moderation
          </Badge>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
            Job Moderation ({total})
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm font-semibold">
            Inspect published and draft listings network-wide, unpublish violations, or archive
            stale roles.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLoading(true);
            setRefreshKey((k) => k + 1);
          }}
          disabled={loading}
          className="border-2 border-black font-bold self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search by job title or location..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 border-2 border-black font-medium"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full md:w-auto px-3 py-2 rounded-xl border-2 border-black font-bold text-xs bg-white dark:bg-[#191919] cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="CLOSED">Closed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Listing */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground font-semibold flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading listings...</span>
        </div>
      ) : (jobs?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl border-2 border-black bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center">
              <Shield className="w-6 h-6 text-muted-foreground" />
            </div>
            <h4 className="text-base font-bold">No jobs match your query</h4>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search keywords or status filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden rounded-2xl border-2 md:border-3 border-black bg-white dark:bg-[#191919] shadow-neo">
            <table className="w-full text-left text-sm">
              <thead className="border-b-2 border-black bg-neutral-100 dark:bg-neutral-800 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4">Title & Company</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Stats</th>
                  <th className="p-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10">
                {(jobs || []).map((job) => {
                  const isActing = actionLoadingId === job._id;
                  return (
                    <tr key={job._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                      <td className="p-4">
                        <div className="font-extrabold text-sm flex items-center gap-2">
                          <span>{job.title}</span>
                          {job.status === "PUBLISHED" && (
                            <Link
                              href={`/jobs/${job.slug}`}
                              target="_blank"
                              className="text-muted-foreground hover:text-black"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground font-semibold">
                          {job.companyId?.name || "Company"} • {job.location} • Employer:{" "}
                          {job.employerId?.name || "Unknown"}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          className={`border-2 border-black font-extrabold text-xs ${
                            job.status === "PUBLISHED"
                              ? "bg-[#06D6A0] text-black"
                              : job.status === "DRAFT"
                                ? "bg-[#FFD166] text-black"
                                : job.status === "CLOSED"
                                  ? "bg-neutral-200 text-black"
                                  : "bg-red-100 text-red-700"
                          }`}
                        >
                          {job.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-xs font-semibold">
                        {job.categoryId?.name || "Uncategorized"}
                      </td>
                      <td className="p-4 text-xs font-semibold text-muted-foreground space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>{job.applicationCount} applicants</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{job.viewCount} views</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {job.status === "PUBLISHED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleModerate(job._id, "unpublish")}
                              disabled={isActing}
                              className="border-2 border-black font-bold text-xs"
                            >
                              Unpublish
                            </Button>
                          )}
                          {job.status !== "ARCHIVED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleModerate(job._id, "archive")}
                              disabled={isActing}
                              className="border-2 border-black font-bold text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Archive
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards (Rule 10 & PLAN.md: tables collapse into cards on mobile) */}
          <div className="md:hidden space-y-3">
            {(jobs || []).map((job) => {
              const isActing = actionLoadingId === job._id;
              return (
                <div
                  key={job._id}
                  className="p-4 rounded-2xl border-2 border-black bg-white dark:bg-[#191919] shadow-neo space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm">{job.title}</h4>
                      <p className="text-xs text-muted-foreground font-semibold">
                        {job.companyId?.name || "Company"} • {job.location}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`border-2 border-black font-bold text-[10px] ${
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

                  <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                    <span>{job.categoryId?.name || "General"}</span>
                    <span>•</span>
                    <span>{job.applicationCount} applicants</span>
                    <span>•</span>
                    <span>{job.viewCount} views</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-black/10">
                    {job.status === "PUBLISHED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleModerate(job._id, "unpublish")}
                        disabled={isActing}
                        className="border-2 border-black font-bold text-xs flex-1"
                      >
                        Unpublish
                      </Button>
                    )}
                    {job.status !== "ARCHIVED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleModerate(job._id, "archive")}
                        disabled={isActing}
                        className="border-2 border-black font-bold text-xs flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Archive
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="border-2 border-black font-bold"
              >
                Previous
              </Button>
              <span className="text-xs font-bold text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="border-2 border-black font-bold"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
