import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getInquiries } from "./actions"
import { InquiriesClient } from "./inquiries-client"

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    status?: string
    priority?: string
    page?: string
  }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const page = parseInt(params.page || "1")

  const result = await getInquiries({
    search: params.search,
    status: params.status,
    priority: params.priority,
    page,
    limit: 25,
  })

  return (
    <InquiriesClient
      data={result}
      search={params.search || ""}
      status={params.status || "all"}
      priority={params.priority || "all"}
      permissions={session.user.permissions}
    />
  )
}
