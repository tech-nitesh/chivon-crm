import { getPayablesAging } from "../actions"
import { PayablesClient } from "./payables-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Accounts Payable (AP) Aging | Chivon CRM",
}

export default async function PayablesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const aging = await getPayablesAging()

  return (
    <PayablesClient
      data={aging}
      permissions={session.user.permissions}
    />
  )
}
