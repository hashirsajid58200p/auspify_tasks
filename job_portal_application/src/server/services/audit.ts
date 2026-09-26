import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { AuditLog, IAuditLog } from "@/server/models/audit-log";

export interface WriteAuditLogParams {
  actorId?: string | Types.ObjectId | null;
  action: string;
  targetType: string;
  targetId?: string;
  meta?: Record<string, unknown>;
}

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  action?: string;
  targetType?: string;
}

export interface PaginatedAuditLogs {
  logs: IAuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function writeAuditLog({
  actorId,
  action,
  targetType,
  targetId,
  meta,
}: WriteAuditLogParams): Promise<IAuditLog> {
  await connectToDatabase();

  const logActorId = actorId
    ? typeof actorId === "string"
      ? new Types.ObjectId(actorId)
      : actorId
    : null;

  const log = await AuditLog.create({
    actorId: logActorId || undefined,
    action,
    targetType,
    targetId: targetId || undefined,
    meta: meta || undefined,
  });

  return log;
}

export async function getAuditLogs(params?: GetAuditLogsParams): Promise<PaginatedAuditLogs> {
  await connectToDatabase();

  const page = Math.max(1, params?.page || 1);
  const limit = Math.min(50, Math.max(1, params?.limit || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (params?.action && params.action.trim()) {
    filter.action = params.action.trim();
  }

  if (params?.targetType && params.targetType.trim()) {
    filter.targetType = params.targetType.trim();
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actorId", "name email role")
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return {
    logs: logs as unknown as IAuditLog[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
