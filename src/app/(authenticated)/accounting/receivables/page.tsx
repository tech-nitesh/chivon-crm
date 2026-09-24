import { getReceivablesAging } from "../actions"
import { ReceivablesClient } from "./receivables-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Accounts Receivable (AR) Aging | Chivon CRM",
}

export default async function ReceivablesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const aging = await getReceivablesAging()

  return (
    <ReceivablesClient
      data={aging}
      permissions={session.user.permissions}
    />
  )
}
