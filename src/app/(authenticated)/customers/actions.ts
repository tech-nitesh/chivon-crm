"use server"

import prisma from "@/lib/db"
import { requirePermission } from "@/lib/permissions"
import { generateBusinessId } from "@/lib/id-generator"
import { createAuditLog } from "@/lib/audit"
import { 
  createCompanySchema, 
  type CreateCompanyInput, 
  type UpdateCompanyInput, 
  updateCompanySchema,
  createContactSchema,
  type CreateContactInput,
} from "@/lib/validations"

export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function getCompanies(params?: {
  search?: string
  page?: number
  limit?: number
}) {
  const session = await requirePermission("customers.view")
  const page = params?.page || 1
  const limit = params?.limit || 25
  const skip = (page - 1) * limit

  const where: any = { isActive: true }
  if (params?.search) {
    where.OR = [
      { name: { contains: params.search } },
      { businessId: { contains: params.search } },
      { email: { contains: params.search } },
      { city: { contains: params.search } },
      { industry: { contains: params.search } },
    ]
  }

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      include: {
        owner: { select: { firstName: true, lastName: true } },
        _count: { select: { contacts: true, inquiries: true, opportunities: true, projects: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.company.count({ where }),
  ])

  return {
    companies: companies.map((c) => ({
      id: c.id,
      businessId: c.businessId,
      name: c.name,
      industry: c.industry,
      email: c.email,
      phone: c.phone,
      city: c.city,
      country: c.country,
      owner: c.owner ? `${c.owner.firstName} ${c.owner.lastName}` : null,
      contactsCount: c._count.contacts,
      inquiriesCount: c._count.inquiries,
      opportunitiesCount: c._count.opportunities,
      projectsCount: c._count.projects,
      createdAt: c.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getCompany(id: string) {
  const session = await requirePermission("customers.view")

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, firstName: true, lastName: true, email: true } },
      contacts: {
        where: { isActive: true },
        orderBy: { isPrimary: "desc" },
      },
      inquiries: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { salesperson: { select: { firstName: true, lastName: true } } },
      },
      opportunities: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      projects: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  })

  if (!company) return null
  return company
}

export async function createCompany(input: CreateCompanyInput): Promise<ActionResult<{ id: string; businessId: string }>> {
  const session = await requirePermission("customers.create")

  const parsed = createCompanySchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".")
      if (!fieldErrors[path]) fieldErrors[path] = []
      fieldErrors[path].push(issue.message)
    }
    return { success: false, error: "Validation failed", fieldErrors }
  }

  // Check for duplicate
  const existing = await prisma.company.findFirst({
    where: { name: parsed.data.name, isActive: true },
  })
  if (existing) {
    return { success: false, error: `A company named "${parsed.data.name}" already exists (${existing.businessId})` }
  }

  const businessId = await generateBusinessId("company")

  const company = await prisma.company.create({
    data: {
      ...parsed.data,
      businessId,
      ownerId: session.user.id,
    },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "company",
    entityId: company.id,
    action: "create",
    after: { name: company.name, businessId: company.businessId },
  })

  return { success: true, data: { id: company.id, businessId: company.businessId } }
}

export async function updateCompany(id: string, input: UpdateCompanyInput): Promise<ActionResult> {
  const session = await requirePermission("customers.edit")

  const parsed = updateCompanySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: "Validation failed" }
  }

  const existing = await prisma.company.findUnique({ where: { id } })
  if (!existing) {
    return { success: false, error: "Company not found" }
  }

  const company = await prisma.company.update({
    where: { id },
    data: parsed.data,
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "company",
    entityId: company.id,
    action: "update",
    before: { name: existing.name },
    after: { name: company.name },
  })

  return { success: true, data: null }
}

export async function deleteCompany(id: string): Promise<ActionResult> {
  const session = await requirePermission("customers.delete")

  const company = await prisma.company.findUnique({ where: { id } })
  if (!company) {
    return { success: false, error: "Company not found" }
  }

  // Soft delete
  await prisma.company.update({
    where: { id },
    data: { isActive: false },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "company",
    entityId: id,
    action: "delete",
    before: { name: company.name, businessId: company.businessId },
  })

  return { success: true, data: null }
}

export async function getCompanyOptions() {
  await requirePermission("customers.view")
  return prisma.company.findMany({
    where: { isActive: true },
    select: { id: true, name: true, businessId: true },
    orderBy: { name: "asc" },
  })
}

export async function getContacts(params?: {
  search?: string
  companyId?: string
  page?: number
  limit?: number
}) {
  await requirePermission("customers.view")
  const page = params?.page || 1
  const limit = params?.limit || 25
  const skip = (page - 1) * limit

  const where: any = { isActive: true }
  if (params?.companyId) {
    where.companyId = params.companyId
  }
  if (params?.search) {
    where.OR = [
      { firstName: { contains: params.search } },
      { lastName: { contains: params.search } },
      { email: { contains: params.search } },
      { phone: { contains: params.search } },
      { designation: { contains: params.search } },
      { company: { name: { contains: params.search } } },
    ]
  }

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, businessId: true } },
        _count: { select: { inquiries: true, opportunities: true } },
      },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.contact.count({ where }),
  ])

  return {
    contacts: contacts.map((c) => ({
      id: c.id,
      businessId: c.businessId,
      name: `${c.firstName} ${c.lastName}`.trim(),
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone || c.mobile,
      designation: c.designation,
      department: c.department,
      isPrimary: c.isPrimary,
      isDecisionMaker: c.isDecisionMaker,
      company: c.company,
      inquiriesCount: c._count.inquiries,
      opportunitiesCount: c._count.opportunities,
      createdAt: c.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getContact(id: string) {
  await requirePermission("customers.view")
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      company: true,
      inquiries: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      opportunities: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  })
  return contact
}

export async function createContact(input: CreateContactInput): Promise<ActionResult<{ id: string; businessId: string }>> {
  const session = await requirePermission("customers.create")

  const parsed = createContactSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".")
      if (!fieldErrors[path]) fieldErrors[path] = []
      fieldErrors[path].push(issue.message)
    }
    return { success: false, error: "Validation failed", fieldErrors }
  }

  // If this is set as primary, unmark any other primary contact for this company
  if (parsed.data.isPrimary) {
    await prisma.contact.updateMany({
      where: { companyId: parsed.data.companyId, isPrimary: true },
      data: { isPrimary: false },
    })
  }

  const businessId = await generateBusinessId("contact")

  const contact = await prisma.contact.create({
    data: {
      ...parsed.data,
      businessId,
    },
    include: { company: true },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "contact",
    entityId: contact.id,
    action: "create",
    after: { name: `${contact.firstName} ${contact.lastName}`, company: contact.company?.name },
  })

  return { success: true, data: { id: contact.id, businessId: contact.businessId } }
}

export async function updateContact(id: string, input: Partial<CreateContactInput>): Promise<ActionResult> {
  const session = await requirePermission("customers.edit")

  const existing = await prisma.contact.findUnique({ where: { id } })
  if (!existing) {
    return { success: false, error: "Contact not found" }
  }

  if (input.isPrimary && existing.companyId) {
    await prisma.contact.updateMany({
      where: { companyId: existing.companyId, isPrimary: true, id: { not: id } },
      data: { isPrimary: false },
    })
  }

  const updated = await prisma.contact.update({
    where: { id },
    data: input,
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "contact",
    entityId: id,
    action: "update",
    before: { name: `${existing.firstName} ${existing.lastName}` },
    after: { name: `${updated.firstName} ${updated.lastName}` },
  })

  return { success: true, data: null }
}

export async function deleteContact(id: string): Promise<ActionResult> {
  const session = await requirePermission("customers.delete")

  const existing = await prisma.contact.findUnique({ where: { id } })
  if (!existing) {
    return { success: false, error: "Contact not found" }
  }

  await prisma.contact.update({
    where: { id },
    data: { isActive: false },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "contact",
    entityId: id,
    action: "delete",
    before: { name: `${existing.firstName} ${existing.lastName}`, businessId: existing.businessId },
  })

  return { success: true, data: null }
}

