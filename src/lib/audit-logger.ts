import { prisma } from "./prisma";

type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "PROCESS" | "APPROVE" | "REJECT" | "SYSTEM";

interface AuditLogPayload {
  userId?: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  changes?: Record<string, any>;
}

export async function logAudit(payload: AuditLogPayload) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: payload.action,
        entity: payload.entity,
        entityId: payload.entityId,
        changes: payload.changes ? payload.changes : undefined,
      },
    });
  } catch (error) {
    console.error("[AUDIT_LOG_ERROR] Failed to save audit log:", error);
    // We intentionally don't throw the error so that the main business logic doesn't fail 
    // just because logging failed.
  }
}
