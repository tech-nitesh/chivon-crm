import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AutomationClient } from "./automation-client"

export const metadata = {
  title: "Workflow Automation & Webhooks | Chivon CRM",
}

export default async function AutomationAdminPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return <AutomationClient permissions={session.user.permissions} />
}
