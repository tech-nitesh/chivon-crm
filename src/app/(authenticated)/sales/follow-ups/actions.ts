"use server"

import prisma from "@/lib/db"
import { requirePermission } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"
import { createFollowUpSchema, type CreateFollowUpInput } from "@/lib/validations"

export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function getFollowUps(params?: {
  search?: string
  status?: string
  page?: number
  limit?: number
}) {
  const session = await requirePermission("customers.view")
  const page = params?.page || 1
  const limit = params?.limit || 50
  const skip = (page - 1) * limit

  const where: any = {}
  if (params?.status && params.status !== "all") {
    where.status = params.status
  }
  if (params?.search) {
    where.OR = [
      { action: { contains: params.search } },
      { company: { name: { contains: params.search } } },
    ]
  }

  const [followUps, total] = await Promise.all([
    prisma.followUp.findMany({
      where,
      include: {
        owner: { select: { firstName: true, lastName: true } },
        company: { select: { id: true, name: true, businessId: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        opportunity: { select: { id: true, businessId: true, title: true } },
      },
      orderBy: { dueDate: "asc" },
      skip,
      take: limit,
    }),
    prisma.followUp.count({ where }),
  ])

  return {
    followUps: followUps.map((f) => ({
      id: f.id,
      action: f.action,
      owner: f.owner ? `${f.owner.firstName} ${f.owner.lastName}` : null,
      company: f.company,
      contact: f.contact ? `${f.contact.firstName} ${f.contact.lastName}` : null,
      opportunity: f.opportunity,
      dueDate: f.dueDate.toISOString(),
      priority: f.priority,
      status: f.status,
      notes: f.notes,
      createdAt: f.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

export async function createFollowUp(input: CreateFollowUpInput) {
  const session = await requirePermission("customers.edit")

  const parsed = createFollowUpSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: "Validation failed" }
  }

  const followUp = await prisma.followUp.create({
    data: {
      action: parsed.data.action,
      companyId: parsed.data.companyId || undefined,
      contactId: parsed.data.contactId || undefined,
      opportunityId: parsed.data.opportunityId || undefined,
      ownerId: session.user.id,
      dueDate: new Date(parsed.data.dueDate),
      priority: parsed.data.priority,
      status: "pending",
      notes: parsed.data.notes,
    },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "follow_up",
    entityId: followUp.id,
    action: "create",
    after: { action: followUp.action, dueDate: followUp.dueDate },
  })

  return { success: true, data: { id: followUp.id } }
}

export async function completeFollowUp(id: string) {
  const session = await requirePermission("customers.edit")

  await prisma.followUp.update({
    where: { id },
    data: {
      status: "completed",
      completedAt: new Date(),
    },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "follow_up",
    entityId: id,
    action: "status_change",
    after: { status: "completed" },
  })

  return { success: true, data: null }
}

export async function updateFollowUpStatus(id: string, status: string) {
  const session = await requirePermission("customers.edit")

  await prisma.followUp.update({
    where: { id },
    data: {
      status,
      completedAt: status === "completed" ? new Date() : null,
    },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "follow_up",
    entityId: id,
    action: "status_change",
    after: { status },
  })

  return { success: true, data: null }
}

export async function updateFollowUp(
  id: string,
  input: {
    action: string
    dueDate: string
    priority: string
    status: string
    notes?: string
  }
): Promise<ActionResult> {
  const session = await requirePermission("customers.edit")

  const updated = await prisma.followUp.update({
    where: { id },
    data: {
      action: input.action,
      dueDate: new Date(input.dueDate),
      priority: input.priority,
      status: input.status,
      completedAt: input.status === "completed" ? new Date() : null,
      notes: input.notes,
    },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "follow_up",
    entityId: id,
    action: "update",
    after: { action: updated.action, status: updated.status, dueDate: updated.dueDate },
  })

  return { success: true, data: null }
}


export async function getFollowUpOptions() {
  await requirePermission("customers.view")
  const [companies, opportunities] = await Promise.all([
    prisma.company.findMany({
      where: { isActive: true },
      select: { id: true, name: true, businessId: true },
      orderBy: { name: "asc" },
    }),
    prisma.opportunity.findMany({
      where: { stage: { notIn: ["won", "lost"] } },
      select: { id: true, businessId: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
  ])
  return { companies, opportunities }
}
