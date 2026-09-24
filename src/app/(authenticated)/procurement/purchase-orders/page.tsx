import { getVendors, getPurchaseRequests } from "../actions"
import { ProcurementPOClient } from "./procurement-po-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Supplier Purchase Orders (LPO) | Chivon CRM",
}

export default async function ProcurementPurchaseOrdersPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [vendors, requests] = await Promise.all([
    getVendors(),
    getPurchaseRequests({ status: "approved" }),
  ])

  return (
    <ProcurementPOClient
      vendors={vendors}
      requests={requests}
      permissions={session.user.permissions}
    />
  )
}
