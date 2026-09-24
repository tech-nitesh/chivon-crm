import { getDocuments, getDocumentOptions } from "./actions"
import { DocumentsClient } from "./documents-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Engineering Drawings, Contracts & Documents | Chivon CRM",
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    category?: string
  }>
}

export default async function DocumentsPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const search = params.search || ""
  const category = params.category || "all"

  const [docs, options] = await Promise.all([
    getDocuments({ search, category }),
    getDocumentOptions(),
  ])

  return (
    <DocumentsClient
      documents={docs}
      options={options}
      search={search}
      category={category}
      permissions={session.user.permissions}
    />
  )
}
