import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getFollowUps, getFollowUpOptions } from "./actions"
import { FollowUpsClient } from "./follow-ups-client"

export default async function FollowUpsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const page = parseInt(params.page || "1")

  const [result, options] = await Promise.all([
    getFollowUps({
      search: params.search,
      status: params.status,
      page,
      limit: 50,
    }),
    getFollowUpOptions(),
  ])

  return (
    <FollowUpsClient
      data={result}
      options={options}
      search={params.search || ""}
      status={params.status || "all"}
      permissions={session.user.permissions}
    />
  )
}
