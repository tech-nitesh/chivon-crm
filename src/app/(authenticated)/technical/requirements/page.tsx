import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getTechnicalRequirements, getTechnicalOptions } from "../actions"
import { RequirementsClient } from "./requirements-client"

export default async function RequirementsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const [requirements, options] = await Promise.all([
    getTechnicalRequirements({ search: params.search }),
    getTechnicalOptions(),
  ])

  return (
    <RequirementsClient
      requirements={requirements}
      options={options}
      search={params.search || ""}
      permissions={session.user.permissions}
    />
  )
}
