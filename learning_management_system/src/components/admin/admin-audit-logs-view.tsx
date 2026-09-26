"use client";

import * as React from "react";
import {
  History,
  Search,
  Shield,
  Clock,
  User,
  ChevronDown,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AuditLogItem {
  id: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  meta?: Record<string, unknown>;
  createdAt: string | Date;
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface AdminAuditLogsViewProps {
  initialLogs: AuditLogItem[];
  initialTotal: number;
}

export function AdminAuditLogsView({ initialLogs, initialTotal }: AdminAuditLogsViewProps) {
  const [logs] = React.useState<AuditLogItem[]>(initialLogs);
  const [filterAction, setFilterAction] = React.useState("");
  const [expandedLogId, setExpandedLogId] = React.useState<string | null>(null);

  const filteredLogs = React.useMemo(() => {
    if (!filterAction.trim()) return logs;
    const q = filterAction.toLowerCase().trim();
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.actor.name.toLowerCase().includes(q) ||
        l.actor.email.toLowerCase().includes(q) ||
        l.targetType.toLowerCase().includes(q)
    );
  }, [logs, filterAction]);

  const toggleExpand = (id: string) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes("SUSPEND") || action.includes("DELETE")) {
      return "bg-destructive/10 text-destructive border-destructive/20";
    }
    if (action.includes("ROLE") || action.includes("MODERATE")) {
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    }
    return "bg-primary/10 text-primary border-primary/20";
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            System Audit Log Ledger
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Immutable chronological ledger documenting administrative interventions, role alterations, and security operations.
          </p>
        </div>
      </div>

      {/* Filter search */}
      <div className="flex items-center gap-3 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Filter logs by action, actor, or type..."
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="pl-9 h-10 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Audit Logs List */}
      <Card className="rounded-2xl border-border bg-card shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
            <History className="w-8 h-8 mx-auto text-muted-foreground/60" />
            <p className="font-semibold text-foreground">No audit entries found</p>
            <p>Administrative mutations will be automatically recorded here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const hasMeta = log.meta && Object.keys(log.meta).length > 0;

              return (
                <div key={log.id} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="p-2 rounded-xl bg-muted/60 text-muted-foreground mt-0.5 sm:mt-0">
                        <History className="w-4 h-4" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`text-2xs font-mono uppercase ${getActionBadgeColor(log.action)}`}>
                            {log.action}
                          </Badge>
                          <Badge variant="outline" className="text-2xs font-mono">
                            {log.targetType}
                            {log.targetId ? `:${log.targetId.slice(-6)}` : ""}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Triggered by <span className="font-semibold text-foreground">{log.actor.name}</span>{" "}
                          ({log.actor.email})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right text-2xs text-muted-foreground">
                        <Clock className="w-3 h-3 inline mr-1 opacity-70" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>

                      {hasMeta && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-2xs h-7 px-2"
                          onClick={() => toggleExpand(log.id)}
                        >
                          {isExpanded ? (
                            <>
                              Hide details <ChevronDown className="w-3 h-3 ml-1" />
                            </>
                          ) : (
                            <>
                              Inspect <ChevronRight className="w-3 h-3 ml-1" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Metadata JSON view */}
                  {isExpanded && hasMeta && (
                    <div className="mt-3 p-3 rounded-xl bg-muted/40 border border-border/50 text-2xs font-mono overflow-x-auto">
                      <pre className="text-muted-foreground">
                        {JSON.stringify(log.meta, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
