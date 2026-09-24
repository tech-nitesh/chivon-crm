import { getPurchaseRequests, getProcurementOptions } from "../actions"
import { RequestsClient } from "./requests-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Material Purchase Requests (PR) | Chivon CRM",
}

interface PageProps {
  searchParams: Promise<{
    status?: string
  }>
}

export default async function PurchaseRequestsPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const status = params.status || "all"

  const [requests, options] = await Promise.all([
    getPurchaseRequests({ status }),
    getProcurementOptions(),
  ])

  return (
    <RequestsClient
      requests={requests}
      options={options}
      status={status}
      permissions={session.user.permissions}
    />
  )
}
