import { getServicesReport } from "../actions"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { Wrench, Cpu, Cog, Layers } from "lucide-react"

export const metadata = {
  title: "Engineering Services & Disciplines Breakdown | Chivon CRM",
}

export default async function ServicesReportPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const data = await getServicesReport()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Wrench className="w-6 h-6 text-primary" />
          Engineering Disciplines & Service Lines
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Revenue and inquiry distribution across industrial engineering disciplines
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(data.disciplineBreakdown).map(([disc, info]) => (
          <div key={disc} className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-base">{disc}</h3>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Cpu className="w-5 h-5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <span className="text-xs text-muted-foreground">Total Inquiries & Tenders</span>
                <div className="text-xl font-bold font-mono text-foreground mt-0.5">
                  {info.count} Leads
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Cumulative RFP Value</span>
                <div className="text-xl font-bold font-mono text-primary mt-0.5">
                  {formatCurrency(info.value)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
