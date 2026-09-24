import { getApprovalRules, getAdminOptions } from "../actions"
import { ApprovalRulesClient } from "./approval-rules-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Approval Thresholds & Governance Rules | Chivon CRM",
}

export default async function ApprovalRulesAdminPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [rules, options] = await Promise.all([
    getApprovalRules(),
    getAdminOptions(),
  ])

  return (
    <ApprovalRulesClient
      rules={rules}
      options={options}
      permissions={session.user.permissions}
    />
  )
}
