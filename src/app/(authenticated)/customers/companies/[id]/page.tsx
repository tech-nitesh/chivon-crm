import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getCompany } from "../../actions"
import { CompanyDetailClient } from "./company-detail-client"

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params
  const company = await getCompany(id)

  if (!company) {
    notFound()
  }

  // Format dates for client component
  const serializedCompany = {
    ...company,
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
    contacts: company.contacts.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    inquiries: company.inquiries.map((i) => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
    })),
    opportunities: company.opportunities.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
    })),
    projects: company.projects.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    })),
    invoices: company.invoices.map((inv) => ({
      ...inv,
      invoiceDate: inv.invoiceDate.toISOString(),
      createdAt: inv.createdAt.toISOString(),
    })),
    activities: company.activities.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
  }

  return (
    <CompanyDetailClient
      company={serializedCompany}
      permissions={session.user.permissions}
    />
  )
}
