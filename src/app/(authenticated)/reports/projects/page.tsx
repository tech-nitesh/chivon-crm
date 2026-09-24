import { getProjectsReport } from "../actions"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { FolderKanban, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Engineering Projects Delivery Report | Chivon CRM",
}

export default async function ProjectsReportPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const data = await getProjectsReport()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <FolderKanban className="w-6 h-6 text-primary" />
          Engineering Operations & Execution Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Turnkey project delivery health, milestone progress, and stage distribution
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <span className="text-xs text-muted-foreground">Total Turnkey Projects</span>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {data.projectsCount} Active Jobs
          </div>
        </div>

        <div className="card p-4">
          <span className="text-xs text-muted-foreground">Total Contract Value</span>
          <div className="text-2xl font-bold font-mono text-primary mt-1">
            {formatCurrency(data.totalContract)}
          </div>
        </div>

        <div className="card p-4">
          <span className="text-xs text-muted-foreground">Overall Task Completion Rate</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {data.overallProgress}%
          </div>
        </div>
      </div>

      {/* Projects Status Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Active Turnkey Project Roster</h2>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project ID</th>
                <th>Title</th>
                <th>Client</th>
                <th>Contract Value</th>
                <th>Execution Stage</th>
              </tr>
            </thead>
            <tbody>
              {data.projects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="font-mono text-xs font-semibold text-primary">{p.businessId}</span>
                  </td>
                  <td>
                    <span className="font-semibold text-foreground text-sm">{p.title}</span>
                  </td>
                  <td>
                    <span className="text-xs text-muted-foreground">{p.company}</span>
                  </td>
                  <td>
                    <span className="font-mono text-sm font-bold text-foreground">
                      {formatCurrency(p.contractValue)}
                    </span>
                  </td>
                  <td>
                    <Badge variant="outline" className="capitalize text-xs">
                      {p.stage.replace("_", " ")}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
