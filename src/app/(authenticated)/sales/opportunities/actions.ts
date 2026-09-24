"use server"

import prisma from "@/lib/db"
import { requirePermission } from "@/lib/permissions"
import { generateBusinessId } from "@/lib/id-generator"
import { createAuditLog } from "@/lib/audit"
import {
  createOpportunitySchema,
  type CreateOpportunityInput,
} from "@/lib/validations"

export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function getOpportunities(params?: {
  search?: string
  stage?: string
  ownerId?: string
  page?: number
  limit?: number
}) {
  await requirePermission("opportunities.view")
  const page = params?.page || 1
  const limit = params?.limit || 50
  const skip = (page - 1) * limit

  const where: any = {}
  if (params?.stage && params.stage !== "all") {
    where.stage = params.stage
  }
  if (params?.ownerId) {
    where.ownerId = params.ownerId
  }
  if (params?.search) {
    where.OR = [
      { businessId: { contains: params.search } },
      { title: { contains: params.search } },
      { company: { name: { contains: params.search } } },
    ]
  }

  const [opportunities, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, businessId: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
        inquiry: { select: { id: true, businessId: true, discipline: true } },
        _count: { select: { quotations: true, siteVisits: true, technicalRequirements: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.opportunity.count({ where }),
  ])

  return {
    opportunities: opportunities.map((opp) => ({
      id: opp.id,
      businessId: opp.businessId,
      title: opp.title,
      company: opp.company,
      contact: opp.contact
        ? {
            id: opp.contact.id,
            name: `${opp.contact.firstName} ${opp.contact.lastName}`,
            email: opp.contact.email,
            phone: opp.contact.phone,
          }
        : null,
      owner: opp.owner ? `${opp.owner.firstName} ${opp.owner.lastName}` : null,
      inquiry: opp.inquiry,
      estimatedValue: opp.estimatedValue || 0,
      stage: opp.stage,
      probability: opp.probability,
      expectedCloseDate: opp.expectedCloseDate ? opp.expectedCloseDate.toISOString() : null,
      counts: opp._count,
      createdAt: opp.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getOpportunity(id: string) {
  await requirePermission("opportunities.view")
  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      company: true,
      contact: true,
      owner: { select: { id: true, firstName: true, lastName: true, email: true } },
      inquiry: true,
      technicalRequirements: {
        orderBy: { createdAt: "desc" },
      },
      siteVisits: {
        include: { engineers: { include: { user: true } } },
        orderBy: { visitDate: "desc" },
      },
      boqs: {
        include: { sections: { include: { items: true } } },
        orderBy: { createdAt: "desc" },
      },
      quotations: {
        include: {
          versions: {
            orderBy: { revision: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      },
      negotiations: {
        orderBy: { createdAt: "desc" },
      },
      activities: {
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  })
  return opportunity
}

export async function createOpportunity(input: CreateOpportunityInput): Promise<ActionResult<{ id: string; businessId: string }>> {
  const session = await requirePermission("opportunities.create")

  const parsed = createOpportunitySchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".")
      if (!fieldErrors[path]) fieldErrors[path] = []
      fieldErrors[path].push(issue.message)
    }
    return { success: false, error: "Validation failed", fieldErrors }
  }

  const businessId = await generateBusinessId("opportunity")

  const opportunity = await prisma.opportunity.create({
    data: {
      businessId,
      companyId: parsed.data.companyId,
      contactId: parsed.data.contactId,
      title: parsed.data.title,
      estimatedValue: parsed.data.estimatedValue ?? 0,
      stage: parsed.data.stage || "qualified",
      probability: parsed.data.probability ?? 10,
      expectedCloseDate: parsed.data.expectedCloseDate ? new Date(parsed.data.expectedCloseDate) : null,
      ownerId: session.user.id,
      notes: parsed.data.notes,
    },
    include: { company: true },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "opportunity",
    entityId: opportunity.id,
    action: "create",
    after: { title: opportunity.title, businessId: opportunity.businessId, company: opportunity.company.name },
  })

  return { success: true, data: { id: opportunity.id, businessId: opportunity.businessId } }
}

export async function updateOpportunityStage(
  id: string,
  stage: string,
  probability?: number,
  lostReason?: string
): Promise<ActionResult> {
  const session = await requirePermission("opportunities.edit")

  const existing = await prisma.opportunity.findUnique({ where: { id } })
  if (!existing) {
    return { success: false, error: "Opportunity not found" }
  }

  // Auto assign default probability by stage if not specified
  const stageProbabilities: Record<string, number> = {
    qualified: 10,
    technical: 30,
    site_visit: 40,
    quotation: 60,
    negotiation: 80,
    awaiting_po: 90,
    won: 100,
    lost: 0,
  }

  const newProb = probability ?? stageProbabilities[stage] ?? existing.probability

  await prisma.opportunity.update({
    where: { id },
    data: {
      stage,
      probability: newProb,
      lostReason: stage === "lost" ? lostReason : undefined,
    },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "opportunity",
    entityId: id,
    action: "status_change",
    before: { stage: existing.stage, probability: existing.probability },
    after: { stage, probability: newProb, lostReason },
  })

  return { success: true, data: null }
}

export async function getOpportunityFormOptions(companyId?: string) {
  await requirePermission("opportunities.view")

  const [companies, contacts, users] = await Promise.all([
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
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
  ])

  return { companies, contacts, users }
}
