import { getAuditLogs } from "../actions"
import { AuditLogsClient } from "./audit-logs-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Immutable Security Audit Logs | Chivon CRM",
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    entityType?: string
  }>
}

export default async function AuditLogsAdminPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const search = params.search || ""
  const entityType = params.entityType || "all"

  const logs = await getAuditLogs({ search, entityType })

  return (
    <AuditLogsClient
      logs={logs}
      search={search}
      entityType={entityType}
      permissions={session.user.permissions}
    />
  )
}
