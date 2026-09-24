import { getTaxSummary } from "../actions"
import { TaxClient } from "./tax-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "UAE VAT 5% Compliance & Tax Returns | Chivon CRM",
}

export default async function TaxPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const summary = await getTaxSummary()

  return (
    <TaxClient
      data={summary}
      permissions={session.user.permissions}
    />
  )
}
