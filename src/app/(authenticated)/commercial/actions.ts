"use server"

import prisma from "@/lib/db"
import { requirePermission } from "@/lib/permissions"
import { generateBusinessId } from "@/lib/id-generator"
import { createAuditLog } from "@/lib/audit"

export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function getQuotations(params?: { search?: string; status?: string }) {
  await requirePermission("quotations.view")
  const where: any = {}
  if (params?.status && params.status !== "all") where.status = params.status
  if (params?.search) {
    where.OR = [
      { businessId: { contains: params.search } },
      { company: { name: { contains: params.search } } },
      { opportunity: { title: { contains: params.search } } },
    ]
  }

  const quotes = await prisma.quotation.findMany({
    where,
    include: {
      company: { select: { id: true, name: true, businessId: true } },
      contact: { select: { id: true, firstName: true, lastName: true, email: true } },
      opportunity: { select: { id: true, businessId: true, title: true } },
      versions: {
        where: { isCurrent: true },
        include: { items: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return quotes.map((q) => {
    const currentVersion = q.versions[0]
    return {
      id: q.id,
      businessId: q.businessId,
      company: q.company,
      contact: q.contact ? `${q.contact.firstName} ${q.contact.lastName}` : null,
      opportunity: q.opportunity,
      status: q.status,
      currentRevision: q.currentRevision,
      validityDays: q.validityDays,
      paymentTerms: q.paymentTerms,
      subtotal: currentVersion?.subtotal || 0,
      taxAmount: currentVersion?.taxAmount || 0,
      grandTotal: currentVersion?.grandTotal || 0,
      itemsCount: currentVersion?.items.length || 0,
      createdAt: q.createdAt.toISOString(),
    }
  })
}

export async function createQuotation(input: {
  companyId: string
  contactId?: string
  opportunityId?: string
  validityDays?: number
  paymentTerms?: string
  deliveryTerms?: string
  termsAndConditions?: string
  items: {
    description: string
    quantity: number
    unit: string
    unitPrice: number
    discount?: number
    taxRate?: number
    notes?: string
  }[]
}): Promise<ActionResult<{ id: string; businessId: string }>> {
  const session = await requirePermission("quotations.create")
  const businessId = await generateBusinessId("quotation")

  let subtotal = 0
  let totalTax = 0

  const processedItems = input.items.map((it, idx) => {
    const lineSubtotal = it.quantity * it.unitPrice * (1 - (it.discount || 0) / 100)
    const lineTax = lineSubtotal * ((it.taxRate !== undefined ? it.taxRate : 5) / 100)
    const lineTotal = lineSubtotal + lineTax
    subtotal += lineSubtotal
    totalTax += lineTax

    return {
      description: it.description,
      quantity: it.quantity,
      unit: it.unit || "nos",
      unitPrice: it.unitPrice,
      discount: it.discount || 0,
      taxRate: it.taxRate !== undefined ? it.taxRate : 5,
      total: lineTotal,
      notes: it.notes,
      sortOrder: idx,
    }
  })

  const grandTotal = subtotal + totalTax

  const quote = await prisma.quotation.create({
    data: {
      businessId,
      companyId: input.companyId,
      contactId: input.contactId || undefined,
      opportunityId: input.opportunityId || undefined,
      validityDays: input.validityDays || 30,
      paymentTerms: input.paymentTerms || "30 days net",
      deliveryTerms: input.deliveryTerms || "Ex-Works / FOB UAE",
      termsAndConditions: input.termsAndConditions,
      status: "draft",
      currentRevision: 0,
      versions: {
        create: {
          revision: 0,
          subtotal,
          taxAmount: totalTax,
          grandTotal,
          createdById: session.user.id,
          isCurrent: true,
          items: {
            create: processedItems,
          },
        },
      },
    },
    include: { company: true },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "quotation",
    entityId: quote.id,
    action: "create",
    after: { businessId: quote.businessId, grandTotal, company: quote.company.name },
  })

  return { success: true, data: { id: quote.id, businessId: quote.businessId } }
}

export async function updateQuotationStatus(id: string, status: string) {
  const session = await requirePermission("quotations.edit")
  const existing = await prisma.quotation.findUnique({ where: { id } })
  if (!existing) return { success: false, error: "Quotation not found" }

  const updated = await prisma.quotation.update({
    where: { id },
    data: { status },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "quotation",
    entityId: id,
    action: "status_change",
    before: { status: existing.status },
    after: { status: updated.status },
  })

  return { success: true, data: null }
}

export async function getQuotationApprovals() {
  await requirePermission("quotations.approve")
  const approvals = await prisma.quotationApproval.findMany({
    include: {
      quotation: {
        include: {
          company: { select: { id: true, name: true, businessId: true } },
          opportunity: { select: { id: true, businessId: true, title: true } },
          versions: { where: { isCurrent: true }, take: 1 },
        },
      },
      approver: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return approvals.map((a) => ({
    id: a.id,
    quotationId: a.quotationId,
    quotationBusinessId: a.quotation.businessId,
    companyName: a.quotation.company.name,
    opportunityTitle: a.quotation.opportunity?.title || null,
    grandTotal: a.quotation.versions[0]?.grandTotal || 0,
    status: a.status,
    comments: a.comments,
    approverName: `${a.approver.firstName} ${a.approver.lastName}`,
    respondedAt: a.respondedAt?.toISOString() || null,
    createdAt: a.createdAt.toISOString(),
  }))
}

export async function decideQuotationApproval(
  approvalId: string,
  decision: "approved" | "rejected",
  comments?: string
) {
  const session = await requirePermission("quotations.approve")
  const approval = await prisma.quotationApproval.findUnique({
    where: { id: approvalId },
    include: { quotation: true },
  })
  if (!approval) return { success: false, error: "Approval request not found" }

  await prisma.$transaction([
    prisma.quotationApproval.update({
      where: { id: approvalId },
      data: {
        status: decision,
        comments,
        respondedAt: new Date(),
      },
    }),
    prisma.quotation.update({
      where: { id: approval.quotationId },
      data: {
        status: decision === "approved" ? "approved" : "rejected",
      },
    }),
  ])

  await createAuditLog({
    userId: session.user.id,
    entityType: "quotation",
    entityId: approval.quotationId,
    action: decision === "approved" ? "approval" : "rejection",
    after: { decision, comments },
  })

  return { success: true, data: null }
}

export async function getNegotiations() {
  await requirePermission("quotations.view")
  const negotiations = await prisma.negotiation.findMany({
    include: {
      quotation: {
        include: {
          company: { select: { id: true, name: true, businessId: true } },
          versions: { where: { isCurrent: true }, take: 1 },
        },
      },
      opportunity: { select: { id: true, businessId: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return negotiations.map((n) => ({
    id: n.id,
    quotationId: n.quotationId,
    quotationBusinessId: n.quotation.businessId,
    companyName: n.quotation.company.name,
    opportunityTitle: n.opportunity?.title || null,
    originalAmount: n.quotation.versions[0]?.grandTotal || 0,
    customerRequest: n.customerRequest,
    priceChange: n.priceChange,
    discountReq: n.discountReq,
    paymentTerms: n.paymentTerms,
    status: n.status,
    internalNotes: n.internalNotes,
    createdAt: n.createdAt.toISOString(),
  }))
}

export async function createNegotiation(input: {
  quotationId: string
  opportunityId?: string
  customerRequest?: string
  priceChange?: string
  discountReq?: string
  paymentTerms?: string
  internalNotes?: string
}) {
  const session = await requirePermission("quotations.edit")

  const neg = await prisma.negotiation.create({
    data: {
      quotationId: input.quotationId,
      opportunityId: input.opportunityId || undefined,
      customerRequest: input.customerRequest,
      priceChange: input.priceChange,
      discountReq: input.discountReq,
      paymentTerms: input.paymentTerms,
      internalNotes: input.internalNotes,
      status: "open",
    },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "quotation",
    entityId: input.quotationId,
    action: "update",
    after: { negotiationId: neg.id, customerRequest: input.customerRequest },
  })

  return { success: true, data: { id: neg.id } }
}

export async function getPurchaseOrders() {
  await requirePermission("quotations.view")
  const pos = await prisma.purchaseOrder.findMany({
    include: {
      company: { select: { id: true, name: true, businessId: true } },
      quotation: { select: { id: true, businessId: true } },
      project: { select: { id: true, businessId: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return pos.map((po) => ({
    id: po.id,
    businessId: po.businessId,
    poNumber: po.poNumber,
    poValue: po.poValue,
    poDate: po.poDate.toISOString(),
    status: po.status,
    company: po.company,
    quotation: po.quotation,
    project: po.project,
    notes: po.notes,
    createdAt: po.createdAt.toISOString(),
  }))
}

export async function createPurchaseOrder(input: {
  companyId: string
  quotationId?: string
  poNumber: string
  poValue: number
  poDate: string
  notes?: string
}): Promise<ActionResult<{ id: string; businessId: string }>> {
  const session = await requirePermission("quotations.edit")
  const businessId = await generateBusinessId("purchase_order")

  const po = await prisma.purchaseOrder.create({
    data: {
      businessId,
      companyId: input.companyId,
      quotationId: input.quotationId || undefined,
      poNumber: input.poNumber,
      poValue: Number(input.poValue) || 0,
      poDate: new Date(input.poDate),
      notes: input.notes,
      status: "received",
    },
    include: { company: true },
  })

  // If linked to quotation, mark quotation as accepted
  if (input.quotationId) {
    await prisma.quotation.update({
      where: { id: input.quotationId },
      data: { status: "accepted" },
    })
  }

  await createAuditLog({
    userId: session.user.id,
    entityType: "purchase_order",
    entityId: po.id,
    action: "create",
    after: { businessId: po.businessId, poNumber: po.poNumber, poValue: po.poValue },
  })

  return { success: true, data: { id: po.id, businessId: po.businessId } }
}

export async function updatePOStatus(id: string, status: string) {
  const session = await requirePermission("quotations.edit")
  await prisma.purchaseOrder.update({
    where: { id },
    data: { status },
  })
  return { success: true, data: null }
}

export async function getCommercialOptions() {
  await requirePermission("quotations.view")
  const [companies, contacts, opportunities, quotations] = await Promise.all([
    prisma.company.findMany({
      where: { isActive: true },
      select: { id: true, name: true, businessId: true },
      orderBy: { name: "asc" },
    }),
    prisma.contact.findMany({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true, companyId: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.opportunity.findMany({
      where: { stage: { notIn: ["lost"] } },
      select: { id: true, businessId: true, title: true, companyId: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.quotation.findMany({
      select: { id: true, businessId: true, companyId: true },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return { companies, contacts, opportunities, quotations }
}
