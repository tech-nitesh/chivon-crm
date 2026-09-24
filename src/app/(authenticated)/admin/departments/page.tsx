import { getDepartments } from "../actions"
import { DepartmentsClient } from "./departments-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Engineering Departments & Business Units | Chivon CRM",
}

export default async function DepartmentsAdminPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const departments = await getDepartments()

  return (
    <DepartmentsClient
      departments={departments}
      permissions={session.user.permissions}
    />
  )
}
