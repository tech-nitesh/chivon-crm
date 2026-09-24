import { getInvoices, getAccountingOptions } from "../actions"
import { InvoicesClient } from "./invoices-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Tax Invoices & Billing | Chivon CRM",
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    status?: string
  }>
}

export default async function InvoicesPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const search = params.search || ""
  const status = params.status || "all"

  const [invoices, options] = await Promise.all([
    getInvoices({ search, status }),
    getAccountingOptions(),
  ])

  return (
    <InvoicesClient
      invoices={invoices}
      options={options}
      search={search}
      status={status}
      permissions={session.user.permissions}
    />
  )
}
