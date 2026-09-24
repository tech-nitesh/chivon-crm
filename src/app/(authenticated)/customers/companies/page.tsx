import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getCompanies } from "../actions"
import { CompaniesClient } from "./companies-client"

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const page = parseInt(params.page || "1")
  const result = await getCompanies({
    search: params.search,
    page,
    limit: 25,
  })

  return (
    <CompaniesClient
      data={result}
      search={params.search || ""}
      permissions={session.user.permissions}
    />
  )
}
