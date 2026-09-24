import { getQuotations, getCommercialOptions } from "../actions"
import { QuotationsClient } from "./quotations-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Quotations & Cost Estimates | Chivon CRM",
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    status?: string
  }>
}

export default async function QuotationsPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const search = params.search || ""
  const status = params.status || "all"

  const [quotes, options] = await Promise.all([
    getQuotations({ search, status }),
    getCommercialOptions(),
  ])

  return (
    <QuotationsClient
      quotations={quotes}
      options={options}
      search={search}
      status={status}
      permissions={session.user.permissions}
    />
  )
}
