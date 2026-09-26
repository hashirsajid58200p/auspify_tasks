import { connectToDatabase } from "@/server/db";
import { AuditLog } from "@/server/models/audit-log";
import { Types } from "mongoose";

export interface CreateAuditLogParams {
  actorId: string | Types.ObjectId;
  action: string;
  targetType: string;
  targetId?: string | null;
  meta?: Record<string, unknown>;
}

export async function recordAuditLog(params: CreateAuditLogParams) {
  await connectToDatabase();
  return await AuditLog.create({
    actorId: new Types.ObjectId(params.actorId),
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId ? String(params.targetId) : undefined,
    meta: params.meta || {},
  });
}
