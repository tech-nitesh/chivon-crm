"use server"

import prisma from "@/lib/db"
import { requirePermission } from "@/lib/permissions"
import { generateBusinessId } from "@/lib/id-generator"
import { createAuditLog } from "@/lib/audit"
import {
  createInquirySchema,
  type CreateInquiryInput,
  qualifyInquirySchema,
  type QualifyInquiryInput,
} from "@/lib/validations"

export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function getInquiries(params?: {
  search?: string
  status?: string
  priority?: string
  salespersonId?: string
  page?: number
  limit?: number
}) {
  await requirePermission("inquiries.view")
  const page = params?.page || 1
  const limit = params?.limit || 25
  const skip = (page - 1) * limit

  const where: any = {}
  if (params?.status && params.status !== "all") {
    where.status = params.status
  }
  if (params?.priority && params.priority !== "all") {
    where.priority = params.priority
  }
  if (params?.salespersonId) {
    where.salespersonId = params.salespersonId
  }
  if (params?.search) {
    where.OR = [
      { businessId: { contains: params.search } },
      { scope: { contains: params.search } },
      { discipline: { contains: params.search } },
      { company: { name: { contains: params.search } } },
      { contact: { firstName: { contains: params.search } } },
      { contact: { lastName: { contains: params.search } } },
    ]
  }

  const [inquiries, total] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, businessId: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        service: { select: { id: true, name: true } },
        salesperson: { select: { id: true, firstName: true, lastName: true } },
        opportunity: { select: { id: true, businessId: true, stage: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.inquiry.count({ where }),
  ])

  return {
    inquiries: inquiries.map((inq) => ({
      id: inq.id,
      businessId: inq.businessId,
      company: inq.company,
      contact: inq.contact
        ? {
            id: inq.contact.id,
            name: `${inq.contact.firstName} ${inq.contact.lastName}`,
            email: inq.contact.email,
            phone: inq.contact.phone,
          }
        : null,
      serviceName: inq.service?.name || null,
      discipline: inq.discipline,
      scope: inq.scope,
      location: inq.location,
      estimatedValue: inq.estimatedValue,
      priority: inq.priority,
      source: inq.source,
      status: inq.status,
      salesperson: inq.salesperson ? `${inq.salesperson.firstName} ${inq.salesperson.lastName}` : null,
      opportunity: inq.opportunity,
      createdAt: inq.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getInquiry(id: string) {
  await requirePermission("inquiries.view")
  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      company: true,
      contact: true,
      service: true,
      department: true,
      salesperson: { select: { id: true, firstName: true, lastName: true, email: true } },
      technicalOwner: { select: { id: true, firstName: true, lastName: true, email: true } },
      opportunity: true,
      activities: {
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  })
  return inquiry
}

export async function createInquiry(input: CreateInquiryInput): Promise<ActionResult<{ id: string; businessId: string }>> {
  const session = await requirePermission("inquiries.create")

  const parsed = createInquirySchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".")
      if (!fieldErrors[path]) fieldErrors[path] = []
      fieldErrors[path].push(issue.message)
    }
    return { success: false, error: "Validation failed", fieldErrors }
  }

  const businessId = await generateBusinessId("inquiry")

  const inquiry = await prisma.inquiry.create({
    data: {
      ...parsed.data,
      businessId,
      salespersonId: parsed.data.salespersonId || session.user.id,
      status: "new",
    },
    include: { company: true },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "inquiry",
    entityId: inquiry.id,
    action: "create",
    after: { businessId: inquiry.businessId, company: inquiry.company.name, priority: inquiry.priority },
  })

  return { success: true, data: { id: inquiry.id, businessId: inquiry.businessId } }
}

export async function qualifyInquiry(
  id: string,
  input: QualifyInquiryInput
): Promise<ActionResult> {
  const session = await requirePermission("inquiries.qualify")

  const parsed = qualifyInquirySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: "Validation failed" }
  }

  const existing = await prisma.inquiry.findUnique({ where: { id } })
  if (!existing) {
    return { success: false, error: "Inquiry not found" }
  }

  await prisma.inquiry.update({
    where: { id },
    data: {
      ...parsed.data,
      status: "qualified",
    },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "inquiry",
    entityId: id,
    action: "status_change",
    before: { status: existing.status },
    after: { status: "qualified", estimatedValue: parsed.data.estimatedValue },
  })

  return { success: true, data: null }
}

export async function updateInquiryStatus(id: string, status: string): Promise<ActionResult> {
  const session = await requirePermission("inquiries.edit")

  const existing = await prisma.inquiry.findUnique({ where: { id } })
  if (!existing) {
    return { success: false, error: "Inquiry not found" }
  }

  await prisma.inquiry.update({
    where: { id },
    data: { status },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "inquiry",
    entityId: id,
    action: "status_change",
    before: { status: existing.status },
    after: { status },
  })

  return { success: true, data: null }
}

export async function updateInquiry(
  id: string,
  input: Partial<CreateInquiryInput> & { status?: string }
): Promise<ActionResult> {
  const session = await requirePermission("inquiries.edit")

  const existing = await prisma.inquiry.findUnique({ where: { id } })
  if (!existing) {
    return { success: false, error: "Inquiry not found" }
  }

  const updated = await prisma.inquiry.update({
    where: { id },
    data: {
      ...input,
      estimatedValue: input.estimatedValue !== undefined ? Number(input.estimatedValue) : undefined,
    },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "inquiry",
    entityId: id,
    action: "update",
    before: { status: existing.status, priority: existing.priority, scope: existing.scope },
    after: { status: updated.status, priority: updated.priority, scope: updated.scope },
  })

  return { success: true, data: null }
}


export async function convertToOpportunity(
  inquiryId: string,
  title?: string,
  estimatedValue?: number
): Promise<ActionResult<{ opportunityId: string; businessId: string }>> {
  const session = await requirePermission("opportunities.create")

  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    include: { company: true, contact: true, opportunity: true },
  })

  if (!inquiry) {
    return { success: false, error: "Inquiry not found" }
  }

  if (inquiry.opportunity) {
    return {
      success: false,
      error: `Opportunity already exists: ${inquiry.opportunity.businessId}`,
    }
  }

  const oppBusinessId = await generateBusinessId("opportunity")
  const oppTitle = title || `${inquiry.discipline || "Project"} - ${inquiry.company.name}`
  const finalValue = estimatedValue ?? inquiry.estimatedValue ?? 0

  const opportunity = await prisma.opportunity.create({
    data: {
      businessId: oppBusinessId,
      inquiryId: inquiry.id,
      companyId: inquiry.companyId,
      contactId: inquiry.contactId,
      title: oppTitle,
      estimatedValue: finalValue,
      stage: "qualified",
      probability: 25,
      ownerId: inquiry.salespersonId || session.user.id,
    },
  })

  // Update inquiry status
  await prisma.inquiry.update({
    where: { id: inquiryId },
    data: { status: "converted" },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "opportunity",
    entityId: opportunity.id,
    action: "create",
    after: { inquiryId: inquiry.businessId, businessId: opportunity.businessId },
  })

  return { success: true, data: { opportunityId: opportunity.id, businessId: opportunity.businessId } }
}

export async function getInquiryFormOptions(companyId?: string) {
  await requirePermission("inquiries.view")

  const [companies, contacts, services, users] = await Promise.all([
    prisma.company.findMany({
      where: { isActive: true },
      select: { id: true, name: true, businessId: true },
      orderBy: { name: "asc" },
    }),
    prisma.contact.findMany({
      where: {
        isActive: true,
        ...(companyId ? { companyId } : {}),
      },
      select: { id: true, firstName: true, lastName: true, companyId: true, designation: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.service.findMany({
      where: { isActive: true },
      select: { id: true, name: true, description: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
  ])

  return { companies, contacts, services, users }
}
