import { getFinanceReport } from "../actions"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { DollarSign, TrendingUp, TrendingDown, Landmark, PieChart } from "lucide-react"

export const metadata = {
  title: "Financial P&L & Cash Flow Analytics | Chivon CRM",
}

export default async function FinanceReportPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const data = await getFinanceReport()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-primary" />
          Financial Performance & P&L Statement
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gross revenues, operational expense burn, cash collections, and operating margin
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <span className="text-xs text-muted-foreground">Total Invoiced Billing</span>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {formatCurrency(data.totalInvoiced)}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Gross contract billings</span>
        </div>

        <div className="card p-4">
          <span className="text-xs text-muted-foreground">Cash Remittances Collected</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {formatCurrency(data.totalCollected)}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Bank cash realized</span>
        </div>

        <div className="card p-4">
          <span className="text-xs text-muted-foreground">Total OPEX Incurred</span>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
            {formatCurrency(data.totalExpenses)}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Operational expenditures</span>
        </div>

        <div className="card p-4">
          <span className="text-xs text-muted-foreground">Net Operating Profit</span>
          <div className="text-2xl font-bold font-mono text-primary mt-1">
            {formatCurrency(data.netOperatingProfit)}
          </div>
          <span className="text-[10px] text-emerald-600 mt-1 block">Operating contribution</span>
        </div>
      </div>

      {/* Expense by Category Breakdown */}
      <div className="card p-6">
        <h2 className="text-base font-semibold mb-4">Operational Expense Distribution</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(data.expenseByCategory).map(([cat, amt]) => (
            <div key={cat} className="p-4 rounded-lg bg-muted/40 border border-border">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {cat.replace("_", " ")}
              </span>
              <div className="text-lg font-bold font-mono text-foreground mt-1">
                {formatCurrency(amt)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
