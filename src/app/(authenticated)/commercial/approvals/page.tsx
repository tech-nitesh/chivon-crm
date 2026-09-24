import { getQuotationApprovals } from "../actions"
import { ApprovalsClient } from "./approvals-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Commercial Approvals | Chivon CRM",
}

export default async function CommercialApprovalsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const approvals = await getQuotationApprovals()

  return (
    <ApprovalsClient
      approvals={approvals}
      permissions={session.user.permissions}
    />
  )
}
