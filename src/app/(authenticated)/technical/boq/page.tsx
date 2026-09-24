import { getBOQs, getTechnicalOptions } from "../actions"
import { BOQClient } from "./boq-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Bill of Quantities (BOQ) | Chivon CRM",
}

interface PageProps {
  searchParams: Promise<{
    search?: string
  }>
}

export default async function BOQPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const search = params.search || ""

  const [boqs, options] = await Promise.all([
    getBOQs({ search }),
    getTechnicalOptions(),
  ])

  return (
    <BOQClient
      boqs={boqs}
      options={options}
      search={search}
      permissions={session.user.permissions}
    />
  )
}
