"use server"

import prisma from "@/lib/db"
import { requireAuth } from "@/lib/permissions"

export async function performGlobalSearch(query: string) {
  const session = await requireAuth()
  if (!session?.user) return { companies: [], contacts: [], inquiries: [], opportunities: [], quotations: [], projects: [], invoices: [] }

  const q = query.trim()
  if (!q) return { companies: [], contacts: [], inquiries: [], opportunities: [], quotations: [], projects: [], invoices: [] }

  const [companies, contacts, inquiries, opportunities, quotations, projects, invoices] = await Promise.all([
    prisma.company.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { businessId: { contains: q } },
          { email: { contains: q } },
        ],
      },
      select: { id: true, businessId: true, name: true, city: true, country: true },
      take: 8,
    }),
    prisma.contact.findMany({
      where: {
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { email: { contains: q } },
          { phone: { contains: q } },
        ],
      },
      include: { company: { select: { id: true, name: true } } },
      take: 8,
    }),
    prisma.inquiry.findMany({
      where: {
        OR: [
          { businessId: { contains: q } },
          { discipline: { contains: q } },
          { scope: { contains: q } },
          { location: { contains: q } },
        ],
      },
      include: {
        company: { select: { name: true } },
      },
      take: 8,
    }),
    prisma.opportunity.findMany({
      where: {
        OR: [
          { businessId: { contains: q } },
          { title: { contains: q } },
        ],
      },
      select: { id: true, businessId: true, title: true, stage: true, estimatedValue: true },
      take: 8,
    }),
    prisma.quotation.findMany({
      where: {
        OR: [
          { businessId: { contains: q } },
          { notes: { contains: q } },
        ],
      },
      include: {
        company: { select: { name: true } },
        versions: { take: 1, orderBy: { revision: "desc" }, select: { grandTotal: true } },
      },
      take: 8,
    }),
    prisma.project.findMany({
      where: {
        OR: [
          { businessId: { contains: q } },
          { title: { contains: q } },
        ],
      },
      select: { id: true, businessId: true, title: true, stage: true, contractValue: true },
      take: 8,
    }),
    prisma.financeInvoice.findMany({
      where: {
        OR: [
          { invoiceNumber: { contains: q } },
          { businessId: { contains: q } },
        ],
      },
      select: { id: true, businessId: true, invoiceNumber: true, status: true, total: true },
      take: 8,
    }),
  ])

  return {
    companies,
    contacts,
    inquiries: inquiries.map((i) => ({
      id: i.id,
      businessId: i.businessId,
      discipline: i.discipline || "General",
      scope: i.scope || "Inquiry Request",
      status: i.status,
      clientName: i.company.name,
    })),
    opportunities: opportunities.map((o) => ({
      id: o.id,
      businessId: o.businessId,
      title: o.title,
      stage: o.stage,
      estimatedValue: o.estimatedValue,
    })),
    quotations: quotations.map((q) => ({
      id: q.id,
      quotationNumber: q.businessId,
      title: `${q.company.name} Quotation`,
      status: q.status,
      totalAmount: q.versions[0]?.grandTotal || 0,
    })),
    projects: projects.map((p) => ({
      id: p.id,
      projectNumber: p.businessId,
      name: p.title,
      stage: p.stage,
      contractValue: p.contractValue,
    })),
    invoices: invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
      totalAmount: inv.total,
    })),
  }
}
