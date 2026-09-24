import prisma from "./db"

type AuditAction = "create" | "update" | "delete" | "status_change" | "approval" | "rejection" | "assignment" | "login" | "logout"

interface AuditLogInput {
  userId?: string | null
  entityType: string
  entityId: string
  action: AuditAction
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  reason?: string | null
  ipAddress?: string | null
}

/**
 * Create an audit log entry for important business operations
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        before: input.before ? JSON.stringify(input.before) : null,
        after: input.after ? JSON.stringify(input.after) : null,
        reason: input.reason,
        ipAddress: input.ipAddress,
      },
    })
  } catch (error) {
    // Audit logging should not break the main operation
    console.error("Failed to create audit log:", error)
  }
}
