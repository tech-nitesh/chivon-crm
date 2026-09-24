import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getActivities, getActivityOptions } from "./actions"
import { ActivitiesClient } from "./activities-client"

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; status?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const page = parseInt(params.page || "1")

  const [result, options] = await Promise.all([
    getActivities({
      search: params.search,
      type: params.type,
      status: params.status,
      page,
      limit: 50,
    }),
    getActivityOptions(),
  ])

  return (
    <ActivitiesClient
      data={result}
      options={options}
      search={params.search || ""}
      type={params.type || "all"}
      status={params.status || "all"}
      permissions={session.user.permissions}
    />
  )
}
