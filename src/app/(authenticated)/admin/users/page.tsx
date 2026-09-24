import { getUsers, getAdminOptions } from "../actions"
import { UsersClient } from "./users-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "User Management & RBAC | Chivon CRM",
}

export default async function UsersAdminPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [users, options] = await Promise.all([
    getUsers(),
    getAdminOptions(),
  ])

  return (
    <UsersClient
      users={users}
      options={options}
      permissions={session.user.permissions}
    />
  )
}
