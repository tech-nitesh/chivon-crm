"use server"

import prisma from "@/lib/db"
import { requirePermission } from "@/lib/permissions"
import { generateBusinessId } from "@/lib/id-generator"
import { createAuditLog } from "@/lib/audit"

export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string }

// ----------------- VENDORS -----------------
export async function getVendors(params?: { search?: string }) {
  await requirePermission("vendors.view")
  const where: any = {}
  if (params?.search) {
    where.OR = [
      { businessId: { contains: params.search } },
      { name: { contains: params.search } },
      { products: { contains: params.search } },
      { contactName: { contains: params.search } },
    ]
  }

  const vendors = await prisma.vendor.findMany({
    where,
    include: {
      bills: { select: { id: true, amount: true, outstanding: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return vendors.map((v) => {
    const totalSpend = v.bills.reduce((sum, b) => sum + b.amount, 0)
    const currentPayable = v.bills.reduce((sum, b) => sum + b.outstanding, 0)

    return {
      id: v.id,
      businessId: v.businessId,
      name: v.name,
      contactName: v.contactName,
      email: v.email,
      phone: v.phone,
      city: v.city,
      country: v.country,
      products: v.products,
      paymentTerms: v.paymentTerms,
      leadTime: v.leadTime,
      isActive: v.isActive,
      totalSpend,
      currentPayable,
      billsCount: v.bills.length,
      createdAt: v.createdAt.toISOString(),
    }
  })
}

export async function createVendor(input: {
  name: string
  contactName?: string
  email?: string
  phone?: string
  city?: string
  country?: string
  products?: string
  paymentTerms?: string
  leadTime?: string
  notes?: string
}): Promise<ActionResult<{ id: string; businessId: string }>> {
  const session = await requirePermission("vendors.create")
  const businessId = await generateBusinessId("vendor")

  const vendor = await prisma.vendor.create({
    data: {
      businessId,
      name: input.name,
      contactName: input.contactName,
      email: input.email,
      phone: input.phone,
      city: input.city,
      country: input.country || "United Arab Emirates",
      products: input.products,
      paymentTerms: input.paymentTerms || "30 days net",
      leadTime: input.leadTime,
      notes: input.notes,
      isActive: true,
    },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "vendor",
    entityId: vendor.id,
    action: "create",
    after: { businessId: vendor.businessId, name: vendor.name },
  })

  return { success: true, data: { id: vendor.id, businessId: vendor.businessId } }
}

export async function toggleVendorActive(id: string, isActive: boolean): Promise<ActionResult> {
  const session = await requirePermission("vendors.edit")
  await prisma.vendor.update({
    where: { id },
    data: { isActive },
  })
  return { success: true, data: null }
}

// ----------------- PURCHASE REQUESTS -----------------
export async function getPurchaseRequests(params?: { status?: string }) {
  await requirePermission("vendors.view")
  const where: any = {}
  if (params?.status && params.status !== "all") where.status = params.status

  const requests = await prisma.purchaseRequest.findMany({
    where,
    include: {
      project: { select: { id: true, businessId: true, title: true } },
      requester: { select: { id: true, firstName: true, lastName: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return requests.map((pr) => {
    const totalEstimated = pr.items.reduce((sum, it) => sum + (it.estimatedCost || 0) * it.quantity, 0)

    return {
      id: pr.id,
      department: pr.department,
      status: pr.status,
      requiredDate: pr.requiredDate?.toISOString() || null,
      notes: pr.notes,
      project: pr.project,
      requester: `${pr.requester.firstName} ${pr.requester.lastName}`,
      itemsCount: pr.items.length,
      totalEstimated,
      items: pr.items,
      createdAt: pr.createdAt.toISOString(),
    }
  })
}

export async function createPurchaseRequest(input: {
  projectId?: string
  department?: string
  requiredDate?: string
  notes?: string
  items: {
    description: string
    specification?: string
    quantity: number
    unit: string
    preferredVendor?: string
    estimatedCost?: number
  }[]
}): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("vendors.create")

  const pr = await prisma.purchaseRequest.create({
    data: {
      projectId: input.projectId || undefined,
      requesterId: session.user.id,
      department: input.department || "Engineering",
      requiredDate: input.requiredDate ? new Date(input.requiredDate) : undefined,
      notes: input.notes,
      status: "pending",
      items: {
        create: input.items.map((it, idx) => ({
          description: it.description,
          specification: it.specification,
          quantity: it.quantity,
          unit: it.unit || "nos",
          preferredVendor: it.preferredVendor,
          estimatedCost: it.estimatedCost ? Number(it.estimatedCost) : undefined,
          sortOrder: idx,
        })),
      },
    },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "purchase_request",
    entityId: pr.id,
    action: "create",
    after: { department: pr.department, itemsCount: input.items.length },
  })

  return { success: true, data: { id: pr.id } }
}

export async function updatePRStatus(id: string, status: string): Promise<ActionResult> {
  const session = await requirePermission("vendors.edit")
  await prisma.purchaseRequest.update({
    where: { id },
    data: { status },
  })
  return { success: true, data: null }
}

export async function getProcurementOptions() {
  await requirePermission("vendors.view")
  const [vendors, projects] = await Promise.all([
    prisma.vendor.findMany({
      where: { isActive: true },
      select: { id: true, name: true, businessId: true },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      select: { id: true, businessId: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
  ])
  return { vendors, projects }
}
