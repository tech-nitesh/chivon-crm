import { getServices, getAdminOptions } from "../actions"
import { ServicesClient } from "./services-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Engineering Services Master Catalog | Chivon CRM",
}

export default async function ServicesAdminPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [services, options] = await Promise.all([
    getServices(),
    getAdminOptions(),
  ])

  return (
    <ServicesClient
      services={services}
      options={options}
      permissions={session.user.permissions}
    />
  )
}
