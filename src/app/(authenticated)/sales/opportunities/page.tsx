import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getOpportunities } from "./actions"
import { OpportunitiesClient } from "./opportunities-client"

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    stage?: string
    view?: string
    page?: string
  }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const page = parseInt(params.page || "1")

  const result = await getOpportunities({
    search: params.search,
    stage: params.stage,
    page,
    limit: 100, // Fetch enough to render the full pipeline in Kanban view
  })

  return (
    <OpportunitiesClient
      data={result}
      search={params.search || ""}
      stage={params.stage || "all"}
      defaultView={(params.view as "kanban" | "list") || "kanban"}
      permissions={session.user.permissions}
    />
  )
}
