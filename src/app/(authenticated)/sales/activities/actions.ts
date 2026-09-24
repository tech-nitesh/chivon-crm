"use server"

import prisma from "@/lib/db"
import { requirePermission } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"
import { createActivitySchema, type CreateActivityInput } from "@/lib/validations"

export async function getActivities(params?: {
  search?: string
  type?: string
  status?: string
  page?: number
  limit?: number
}) {
  await requirePermission("customers.view")
  const page = params?.page || 1
  const limit = params?.limit || 50
  const skip = (page - 1) * limit

  const where: any = {}
  if (params?.type && params.type !== "all") {
    where.type = params.type
  }
  if (params?.status && params.status !== "all") {
    where.status = params.status
  }
  if (params?.search) {
    where.OR = [
      { subject: { contains: params.search } },
      { description: { contains: params.search } },
      { company: { name: { contains: params.search } } },
    ]
  }

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true } },
        company: { select: { id: true, name: true, businessId: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        opportunity: { select: { id: true, businessId: true, title: true } },
        inquiry: { select: { id: true, businessId: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.activity.count({ where }),
  ])

  return {
    activities: activities.map((a) => ({
      id: a.id,
      type: a.type,
      subject: a.subject,
      description: a.description,
      user: a.user ? `${a.user.firstName} ${a.user.lastName}` : null,
      company: a.company,
      contact: a.contact ? `${a.contact.firstName} ${a.contact.lastName}` : null,
      opportunity: a.opportunity,
      inquiry: a.inquiry,
      priority: a.priority,
      status: a.status,
      dueDate: a.dueDate ? a.dueDate.toISOString() : null,
      completedAt: a.completedAt ? a.completedAt.toISOString() : null,
      createdAt: a.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

export async function createActivity(input: CreateActivityInput) {
  const session = await requirePermission("customers.edit")

  const parsed = createActivitySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: "Validation failed" }
  }

  const activity = await prisma.activity.create({
    data: {
      type: parsed.data.type,
      subject: parsed.data.subject,
      description: parsed.data.description,
      companyId: parsed.data.companyId || undefined,
      contactId: parsed.data.contactId || undefined,
      opportunityId: parsed.data.opportunityId || undefined,
      inquiryId: parsed.data.inquiryId || undefined,
      projectId: parsed.data.projectId || undefined,
      userId: session.user.id,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      priority: parsed.data.priority,
      status: "pending",
    },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "activity",
    entityId: activity.id,
    action: "create",
    after: { type: activity.type, subject: activity.subject },
  })

  return { success: true, data: { id: activity.id } }
}

export async function updateActivityStatus(id: string, status: string) {
  const session = await requirePermission("customers.edit")

  const updated = await prisma.activity.update({
    where: { id },
    data: {
      status,
      completedAt: status === "completed" ? new Date() : null,
    },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "activity",
    entityId: id,
    action: "status_change",
    after: { status },
  })

  return { success: true, data: null }
}

export async function getActivityOptions() {
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
