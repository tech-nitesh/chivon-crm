import { getRoles } from "../actions"
import { RolesClient } from "./roles-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Roles & Permissions (RBAC) | Chivon CRM",
}

export default async function RolesAdminPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const roles = await getRoles()

  return (
    <RolesClient
      roles={roles}
      permissions={session.user.permissions}
    />
  )
}
