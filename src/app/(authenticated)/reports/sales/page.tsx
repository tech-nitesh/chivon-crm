import { getSalesReport } from "../actions"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, BarChart3, Award, DollarSign, Target, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Sales & Pipeline Analytics | Chivon CRM",
}

export default async function SalesReportPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const data = await getSalesReport()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          Sales & Pipeline Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Revenue forecasting, opportunity conversion rates, and pipeline health
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <span className="text-xs text-muted-foreground">Total Active Pipeline</span>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {formatCurrency(data.totalPipeline)}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Unweighted gross pipeline</span>
        </div>

        <div className="card p-4">
          <span className="text-xs text-muted-foreground">Probability-Weighted Pipeline</span>
          <div className="text-2xl font-bold font-mono text-primary mt-1">
            {formatCurrency(data.weightedPipeline)}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Expected closing value</span>
        </div>

        <div className="card p-4">
          <span className="text-xs text-muted-foreground">Closed Won Deals</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {formatCurrency(data.totalWon)}
          </div>
          <span className="text-[10px] text-emerald-600 mt-1 block">{data.wonCount} won contracts</span>
        </div>

        <div className="card p-4">
          <span className="text-xs text-muted-foreground">Opportunity Win Rate</span>
          <div className="text-2xl font-bold font-mono text-purple-600 mt-1">
            {data.winRate.toFixed(1)}%
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Conversion efficiency</span>
        </div>
      </div>

      {/* Stage Breakdown */}
      <div className="card p-6">
        <h2 className="text-base font-semibold mb-4">Pipeline Distribution by Deal Stage</h2>
        <div className="space-y-4">
          {Object.entries(data.stageCounts).map(([stage, info]) => {
            const pct = data.totalPipeline > 0 ? (info.value / data.totalPipeline) * 100 : 0
            return (
              <div key={stage} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                    {stage.replace("_", " ")} ({info.count} deals)
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {formatCurrency(info.value)} ({pct.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
