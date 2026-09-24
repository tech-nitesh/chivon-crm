import { getBankAccounts } from "../actions"
import { BankingClient } from "./banking-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Treasury & Bank Accounts | Chivon CRM",
}

export default async function BankingPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const accounts = await getBankAccounts()

  return (
    <BankingClient
      accounts={accounts}
      permissions={session.user.permissions}
    />
  )
}
