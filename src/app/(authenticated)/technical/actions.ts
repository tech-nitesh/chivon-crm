"use server"

import prisma from "@/lib/db"
import { requirePermission } from "@/lib/permissions"
import { generateBusinessId } from "@/lib/id-generator"
import { createAuditLog } from "@/lib/audit"

export async function getTechnicalRequirements(params?: { search?: string }) {
  await requirePermission("technical.view")
  const where: any = {}
  if (params?.search) {
    where.OR = [
      { serviceType: { contains: params.search } },
      { templateData: { contains: params.search } },
      { opportunity: { title: { contains: params.search } } },
      { opportunity: { company: { name: { contains: params.search } } } },
    ]
  }

  const items = await prisma.technicalRequirement.findMany({
    where,
    include: {
      opportunity: {
        select: {
          id: true,
          businessId: true,
          title: true,
          company: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return items.map((tr) => {
    let parsed: any = {}
    try {
      parsed = JSON.parse(tr.templateData || "{}")
    } catch {
      parsed = {}
    }

    return {
      id: tr.id,
      serviceType: tr.serviceType,
      equipmentTag: parsed.equipmentTag || null,
      standards: parsed.standards || null,
      specifications: parsed.specifications || null,
      status: tr.status,
      opportunity: tr.opportunity,
      createdAt: tr.createdAt.toISOString(),
    }
  })
}

export async function createTechnicalRequirement(input: {
  opportunityId: string
  serviceType: string
  equipmentTag?: string
  operatingCond?: string
  specifications?: string
  standards?: string
}) {
  const session = await requirePermission("technical.edit")
  const templateData = JSON.stringify({
    equipmentTag: input.equipmentTag,
    operatingCond: input.operatingCond,
    specifications: input.specifications,
    standards: input.standards,
  })

  const req = await prisma.technicalRequirement.create({
    data: {
      opportunityId: input.opportunityId,
      serviceType: input.serviceType,
      templateData,
      status: "pending",
    },
    include: { opportunity: true },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "technical_requirement",
    entityId: req.id,
    action: "create",
    after: { serviceType: req.serviceType, opportunityId: req.opportunity.businessId },
  })

  return { success: true, data: { id: req.id } }
}

export async function getSiteVisits(params?: { search?: string; status?: string }) {
  await requirePermission("technical.view")
  const where: any = {}
  if (params?.status && params.status !== "all") where.status = params.status
  if (params?.search) {
    where.OR = [
      { purpose: { contains: params.search } },
      { location: { contains: params.search } },
      { company: { name: { contains: params.search } } },
      { opportunity: { title: { contains: params.search } } },
    ]
  }

  const visits = await prisma.siteVisit.findMany({
    where,
    include: {
      company: { select: { id: true, name: true } },
      opportunity: {
        select: {
          id: true,
          businessId: true,
          title: true,
          company: { select: { id: true, name: true } },
        },
      },
      engineers: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
    orderBy: { visitDate: "desc" },
  })

  return visits.map((v) => ({
    id: v.id,
    purpose: v.purpose,
    visitDate: v.visitDate.toISOString(),
    location: v.location,
    status: v.status,
    company: v.company,
    opportunity: v.opportunity,
    engineers: v.engineers.map((e) => `${e.user.firstName} ${e.user.lastName}`).join(", "),
    outcome: v.outcome,
    nextAction: v.nextAction,
    createdAt: v.createdAt.toISOString(),
  }))
}

export async function createSiteVisit(input: {
  opportunityId?: string
  companyId?: string
  purpose: string
  visitDate: string
  location: string
  nextAction?: string
  engineerIds?: string[]
}) {
  const session = await requirePermission("technical.edit")

  // Resolve companyId if not provided directly
  let companyId = input.companyId
  if (!companyId && input.opportunityId) {
    const opp = await prisma.opportunity.findUnique({
      where: { id: input.opportunityId },
      select: { companyId: true },
    })
    if (opp) companyId = opp.companyId
  }

  if (!companyId) {
    const defaultCompany = await prisma.company.findFirst({ select: { id: true } })
    companyId = defaultCompany?.id || ""
  }

  const visit = await prisma.siteVisit.create({
    data: {
      opportunityId: input.opportunityId || undefined,
      companyId,
      purpose: input.purpose,
      visitDate: new Date(input.visitDate),
      location: input.location,
      nextAction: input.nextAction,
      status: "scheduled",
      engineers: input.engineerIds?.length
        ? {
            create: input.engineerIds.map((userId) => ({ userId })),
          }
        : undefined,
    },
    include: { company: true },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "site_visit",
    entityId: visit.id,
    action: "create",
    after: { purpose: visit.purpose, visitDate: visit.visitDate, company: visit.company.name },
  })

  return { success: true, data: { id: visit.id } }
}

export async function updateSiteVisitStatus(id: string, status: string, outcome?: string, nextAction?: string) {
  const session = await requirePermission("technical.edit")
  const visit = await prisma.siteVisit.update({
    where: { id },
    data: {
      status,
      outcome: outcome || undefined,
      nextAction: nextAction || undefined,
    },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "site_visit",
    entityId: id,
    action: "status_change",
    after: { status, outcome: visit.outcome },
  })

  return { success: true, data: null }
}

export async function getBOQs(params?: { search?: string }) {
  await requirePermission("technical.view")
  const where: any = {}
  if (params?.search) {
    where.OR = [
      { businessId: { contains: params.search } },
      { title: { contains: params.search } },
      { opportunity: { company: { name: { contains: params.search } } } },
    ]
  }

  const boqs = await prisma.bOQ.findMany({
    where,
    include: {
      opportunity: {
        select: {
          id: true,
          businessId: true,
          title: true,
          company: { select: { id: true, name: true } },
        },
      },
      sections: { include: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return boqs.map((b) => {
    let totalItems = 0
    b.sections.forEach((s) => (totalItems += s.items.length))
    return {
      id: b.id,
      businessId: b.businessId,
      title: b.title,
      status: b.status,
      totalCost: b.totalCost,
      totalSelling: b.totalSelling,
      margin: b.totalSelling > 0 ? ((b.totalSelling - b.totalCost) / b.totalSelling) * 100 : 0,
      totalItems,
      sectionsCount: b.sections.length,
      opportunity: b.opportunity,
      createdAt: b.createdAt.toISOString(),
    }
  })
}

export async function createBOQ(input: {
  opportunityId: string
  title: string
  sections: {
    title: string
    items: {
      description: string
      specification?: string
      quantity: number
      unit: string
      costPrice: number
      sellingPrice: number
    }[]
  }[]
}) {
  const session = await requirePermission("technical.edit")
  const businessId = await generateBusinessId("boq")

  let totalCost = 0
  let totalSelling = 0

  input.sections.forEach((s) => {
    s.items.forEach((it) => {
      totalCost += it.costPrice * it.quantity
      totalSelling += it.sellingPrice * it.quantity
    })
  })

  const boq = await prisma.bOQ.create({
    data: {
      businessId,
      opportunityId: input.opportunityId,
      title: input.title,
      status: "draft",
      totalCost,
      totalSelling,
      sections: {
        create: input.sections.map((s, idx) => ({
          title: s.title,
          sortOrder: idx,
          items: {
            create: s.items.map((it, itemIdx) => ({
              description: it.description,
              specification: it.specification,
              quantity: it.quantity,
              unit: it.unit,
              costPrice: it.costPrice,
              sellingPrice: it.sellingPrice,
              sortOrder: itemIdx,
            })),
          },
        })),
      },
    },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "boq",
    entityId: boq.id,
    action: "create",
    after: { businessId: boq.businessId, totalSelling: boq.totalSelling },
  })

  return { success: true, data: { id: boq.id, businessId: boq.businessId } }
}

export async function getTechnicalOptions() {
  await requirePermission("technical.view")
  const [opportunities, users, companies] = await Promise.all([
    prisma.opportunity.findMany({
      where: { stage: { notIn: ["won", "lost"] } },
      select: {
        id: true,
        businessId: true,
        title: true,
        company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.company.findMany({
      where: { isActive: true },
      select: { id: true, name: true, businessId: true },
      orderBy: { name: "asc" },
    }),
  ])
  return { opportunities, users, companies }
}
