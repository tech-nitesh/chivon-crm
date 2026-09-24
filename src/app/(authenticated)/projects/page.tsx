import { getProjects, getProjectOptions } from "./actions"
import { ProjectsClient } from "./projects-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Engineering Projects & Execution | Chivon CRM",
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    stage?: string
  }>
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const search = params.search || ""
  const stage = params.stage || "all"

  const [projects, options] = await Promise.all([
    getProjects({ search, stage }),
    getProjectOptions(),
  ])

  return (
    <ProjectsClient
      projects={projects}
      options={options}
      search={search}
      stage={stage}
      permissions={session.user.permissions}
    />
  )
}
