import { getBills, getAccountingOptions } from "../actions"
import { BillsClient } from "./bills-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Supplier Bills & Accounts Payable | Chivon CRM",
}

export default async function BillsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [bills, options] = await Promise.all([
    getBills(),
    getAccountingOptions(),
  ])

  return (
    <BillsClient
      bills={bills}
      options={options}
      permissions={session.user.permissions}
    />
  )
}
