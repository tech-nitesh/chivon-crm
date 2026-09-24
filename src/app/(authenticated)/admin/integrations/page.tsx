import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { IntegrationsClient } from "./integrations-client"

export const metadata = {
  title: "Accounting Integrations & Connected Apps | Chivon CRM",
}

export default async function IntegrationsAdminPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return <IntegrationsClient permissions={session.user.permissions} />
}
