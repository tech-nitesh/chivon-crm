import { getNegotiations, getCommercialOptions } from "../actions"
import { NegotiationsClient } from "./negotiations-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Commercial Negotiations & Discounts | Chivon CRM",
}

export default async function NegotiationsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [negotiations, options] = await Promise.all([
    getNegotiations(),
    getCommercialOptions(),
  ])

  return (
    <NegotiationsClient
      negotiations={negotiations}
      options={options}
      permissions={session.user.permissions}
    />
  )
}
