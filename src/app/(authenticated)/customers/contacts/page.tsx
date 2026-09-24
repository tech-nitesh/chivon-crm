import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getContacts } from "../actions"
import { ContactsClient } from "./contacts-client"

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; companyId?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const page = parseInt(params.page || "1")
  const result = await getContacts({
    search: params.search,
    companyId: params.companyId,
    page,
    limit: 25,
  })

  return (
    <ContactsClient
      data={result}
      search={params.search || ""}
      companyId={params.companyId || ""}
      permissions={session.user.permissions}
    />
  )
}
