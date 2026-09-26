"use client";

import * as React from "react";
import { History, Search, Loader2, RefreshCw, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchApi } from "@/lib/api-client";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/formatters";

interface AuditLogItem {
  _id: string;
  action: string;
  targetType: string;
  targetId?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
  actorId?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}

export function AuditLogsView() {
  const [logs, setLogs] = React.useState<AuditLogItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionFilter, setActionFilter] = React.useState("");
  const [targetTypeFilter, setTargetTypeFilter] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);

  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const params = new URLSearchParams();
        if (actionFilter) params.set("action", actionFilter);
        if (targetTypeFilter) params.set("targetType", targetTypeFilter);
        params.set("page", page.toString());
        params.set("limit", "20");

        const res = await fetchApi<{
          data: AuditLogItem[];
          meta: { total: number; totalPages: number; page: number };
        }>(`/api/admin/audit-logs?${params.toString()}`);

        if (isMounted) {
          const list = Array.isArray(res) ? res : res?.data || [];
          setLogs(list);
          if (res && "meta" in res && res.meta) {
            setTotalPages(res.meta.totalPages || 1);
            setTotal(res.meta.total || list.length);
          } else {
            setTotal(list.length);
          }
        }
      } catch (err: any) {
        if (isMounted) toast.error(err.message || "Failed to load audit logs");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [actionFilter, targetTypeFilter, page, refreshKey]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge className="bg-neutral-800 text-white border-2 border-black font-bold uppercase text-[11px]">
            Platform Governance
          </Badge>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
            Audit Log Ledger ({total})
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm font-semibold">
            Immutable log of all administrative actions, moderation events, and security state
            changes.
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
          <div className="flex flex-wrap gap-3">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border-2 border-black font-bold text-xs bg-white dark:bg-[#191919] cursor-pointer"
            >
              <option value="">All Actions</option>
              <option value="USER_MODERATION">USER_MODERATION</option>
              <option value="JOB_UNPUBLISH">JOB_UNPUBLISH</option>
              <option value="JOB_ARCHIVE">JOB_ARCHIVE</option>
              <option value="CATEGORY_CREATE">CATEGORY_CREATE</option>
              <option value="CATEGORY_UPDATE">CATEGORY_UPDATE</option>
              <option value="CATEGORY_DELETE">CATEGORY_DELETE</option>
              <option value="PASSWORD_CHANGE">PASSWORD_CHANGE</option>
              <option value="ACCOUNT_DELETED">ACCOUNT_DELETED</option>
            </select>

            <select
              value={targetTypeFilter}
              onChange={(e) => {
                setTargetTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border-2 border-black font-bold text-xs bg-white dark:bg-[#191919] cursor-pointer"
            >
              <option value="">All Target Types</option>
              <option value="User">User</option>
              <option value="Job">Job</option>
              <option value="Category">Category</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table / Cards */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground font-semibold flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading audit log records...</span>
        </div>
      ) : (logs?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl border-2 border-black bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center">
              <History className="w-6 h-6 text-muted-foreground" />
            </div>
            <h4 className="text-base font-bold">No audit entries found</h4>
            <p className="text-xs text-muted-foreground">
              Recorded moderation activities will automatically appear in this ledger.
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
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Target</th>
                  <th className="p-4">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10">
                {(logs || []).map((log) => (
                  <tr
                    key={log._id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 align-top"
                  >
                    <td className="p-4 text-xs font-semibold whitespace-nowrap">
                      <div>{new Date(log.createdAt).toLocaleString()}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {formatRelativeTime(log.createdAt)}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className="border-2 border-black font-extrabold text-[11px] bg-neutral-100 dark:bg-neutral-800"
                      >
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs font-semibold">
                      {log.actorId ? (
                        <div>
                          <span className="font-extrabold">{log.actorId.name}</span>
                          <span className="block text-[11px] text-muted-foreground">
                            {log.actorId.email} ({log.actorId.role})
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">System / Anonymous</span>
                      )}
                    </td>
                    <td className="p-4 text-xs font-semibold">
                      <Badge variant="outline" className="border-black font-bold text-[10px] mr-1">
                        {log.targetType}
                      </Badge>
                      {log.targetId && (
                        <span className="font-mono text-[11px] text-muted-foreground block mt-0.5 truncate max-w-[140px]">
                          id: {log.targetId}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs">
                      {log.meta ? (
                        <pre className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 font-mono text-[11px] max-w-xs overflow-x-auto">
                          {JSON.stringify(log.meta, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-muted-foreground/60 italic">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards (Rule 10 & PLAN.md: tables collapse into cards on mobile) */}
          <div className="md:hidden space-y-3">
            {(logs || []).map((log) => (
              <div
                key={log._id}
                className="p-4 rounded-2xl border-2 border-black bg-white dark:bg-[#191919] shadow-neo space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className="border-2 border-black font-extrabold text-[10px]"
                  >
                    {log.action}
                  </Badge>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {formatRelativeTime(log.createdAt)}
                  </span>
                </div>

                <div className="text-xs font-semibold space-y-1">
                  <div>
                    <span className="text-muted-foreground">Actor: </span>
                    {log.actorId ? `${log.actorId.name} (${log.actorId.role})` : "System"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Target: </span>
                    {log.targetType} {log.targetId ? `(${log.targetId})` : ""}
                  </div>
                </div>

                {log.meta && (
                  <pre className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 font-mono text-[10px] overflow-x-auto">
                    {JSON.stringify(log.meta, null, 2)}
                  </pre>
                )}
              </div>
            ))}
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
