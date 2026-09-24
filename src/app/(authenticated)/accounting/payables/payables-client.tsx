"use client"

import React from "react"
import Link from "next/link"
import {
  TrendingUp,
  Building2,
  Calendar,
  AlertTriangle,
  ArrowRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"

interface PayablesClientProps {
  data: {
    items: {
      id: string
      billNumber: string
      vendor: { id: string; name: string; businessId: string }
      amount: number
      outstanding: number
      dueDate: string
      overdueDays: number
    }[]
    summary: {
      totalOutstanding: number
      current: number
      overdue: number
    }
  }
  permissions: string[]
}

export function PayablesClient({ data }: PayablesClientProps) {
  const { summary, items } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          Accounts Payable (AP) Aging Report
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor vendor obligations, supplier payment deadlines, and outgoing cash requirements
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 border-l-4 border-l-blue-500">
          <span className="text-xs text-muted-foreground">Total AP Due</span>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            {formatCurrency(summary.totalOutstanding)}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Active supplier bills</span>
        </div>

        <div className="card p-4 border-l-4 border-l-emerald-500">
          <span className="text-xs text-muted-foreground">Current (Due Later)</span>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            {formatCurrency(summary.current)}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Within credit terms</span>
        </div>

        <div className="card p-4 border-l-4 border-l-rose-500">
          <span className="text-xs text-muted-foreground">Overdue Supplier Bills</span>
          <div className="text-xl font-bold font-mono text-rose-600 mt-1">
            {formatCurrency(summary.overdue)}
          </div>
          <span className="text-[10px] text-rose-600 font-medium mt-1 block">Action required</span>
        </div>
      </div>

      {/* AP Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">Vendor Outstanding Balances</h2>
          <span className="text-xs text-muted-foreground">{items.length} Pending Bills</span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bill Number</th>
                <th>Supplier / Vendor</th>
                <th>Payment Due Date</th>
                <th>Status / Delay</th>
                <th>Total Invoiced</th>
                <th>Outstanding Balance</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    No outstanding vendor liabilities. All supplier bills are paid.
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id} className="hover:bg-muted/40 transition-colors">
                    <td>
                      <span className="font-semibold text-foreground text-sm font-mono">
                        {it.billNumber}
                      </span>
                    </td>
                    <td>
                      <div className="font-medium text-foreground text-sm flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <Link href={`/procurement/vendors`} className="hover:text-primary">
                          {it.vendor.name}
                        </Link>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(it.dueDate)}
                      </div>
                    </td>
                    <td>
                      <Badge
                        variant="outline"
                        className={`text-xs font-mono ${
                          it.overdueDays > 0
                            ? "bg-rose-500/10 text-rose-600 border-rose-500/20 font-semibold"
                            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        }`}
                      >
                        {it.overdueDays > 0 ? `${it.overdueDays} Days Past Due` : "Due on schedule"}
                      </Badge>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatCurrency(it.amount)}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-sm font-bold text-rose-600">
                        {formatCurrency(it.outstanding)}
                      </span>
                    </td>
                    <td className="text-right">
                      <Link href={`/accounting/bills`}>
                        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                          View
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
