import { getPayments, getAccountingOptions } from "../actions"
import { PaymentsClient } from "./payments-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Payments Received | Chivon CRM",
}

export default async function PaymentsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [payments, options] = await Promise.all([
    getPayments(),
    getAccountingOptions(),
  ])

  return (
    <PaymentsClient
      payments={payments}
      options={options}
      permissions={session.user.permissions}
    />
  )
}
