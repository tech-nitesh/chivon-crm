import { getExpenses, getAccountingOptions } from "../actions"
import { ExpensesClient } from "./expenses-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Operational Expenses & OPEX | Chivon CRM",
}

export default async function ExpensesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [expenses, options] = await Promise.all([
    getExpenses(),
    getAccountingOptions(),
  ])

  return (
    <ExpensesClient
      expenses={expenses}
      options={options}
      permissions={session.user.permissions}
    />
  )
}
