import { getPurchaseOrders, getCommercialOptions } from "../actions"
import { PurchaseOrdersClient } from "./po-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Client Purchase Orders | Chivon CRM",
}

export default async function PurchaseOrdersPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [orders, options] = await Promise.all([
    getPurchaseOrders(),
    getCommercialOptions(),
  ])

  return (
    <PurchaseOrdersClient
      orders={orders}
      options={options}
      permissions={session.user.permissions}
    />
  )
}
