import { getVendors } from "../actions"
import { VendorsClient } from "./vendors-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Approved Vendor Directory & Suppliers | Chivon CRM",
}

interface PageProps {
  searchParams: Promise<{
    search?: string
  }>
}

export default async function VendorsPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const search = params.search || ""

  const vendors = await getVendors({ search })

  return (
    <VendorsClient
      vendors={vendors}
      search={search}
      permissions={session.user.permissions}
    />
  )
}
