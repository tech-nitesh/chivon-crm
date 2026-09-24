import { getSiteVisits, getTechnicalOptions } from "../actions"
import { SiteVisitsClient } from "./site-visits-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Site Visits & Engineering Audits | Chivon CRM",
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    status?: string
  }>
}

export default async function SiteVisitsPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const search = params.search || ""
  const status = params.status || "all"

  const [visits, options] = await Promise.all([
    getSiteVisits({ search, status }),
    getTechnicalOptions(),
  ])

  return (
    <SiteVisitsClient
      visits={visits}
      options={options}
      search={search}
      status={status}
      permissions={session.user.permissions}
    />
  )
}
