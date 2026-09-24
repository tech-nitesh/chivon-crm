"use client"

import React from "react"
import Link from "next/link"
import {
  TrendingDown,
  Building2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Clock,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"

interface ReceivablesClientProps {
  data: {
    items: {
      id: string
      invoiceNumber: string
      company: { id: string; name: string; businessId: string }
      total: number
      outstanding: number
      dueDate: string
      overdueDays: number
      bucket: string
    }[]
    summary: {
      totalOutstanding: number
      current: number
      days30: number
      days60: number
      days90Plus: number
    }
  }
  permissions: string[]
}

export function ReceivablesClient({ data }: ReceivablesClientProps) {
  const { summary, items } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <TrendingDown className="w-6 h-6 text-primary" />
          Accounts Receivable (AR) Aging Report
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor outstanding customer receivables, payment collection aging, and cash flow risk
        </p>
      </div>

      {/* Aging Bucket Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-4 border-l-4 border-l-blue-500">
          <span className="text-xs text-muted-foreground">Total Receivables</span>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            {formatCurrency(summary.totalOutstanding)}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Active open invoices</span>
        </div>

        <div className="card p-4 border-l-4 border-l-emerald-500">
          <span className="text-xs text-muted-foreground">Current (Not Due)</span>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            {formatCurrency(summary.current)}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Within credit terms</span>
        </div>

        <div className="card p-4 border-l-4 border-l-amber-500">
          <span className="text-xs text-muted-foreground">1 – 30 Days Overdue</span>
          <div className="text-xl font-bold font-mono text-amber-600 mt-1">
            {formatCurrency(summary.days30)}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">First follow-up phase</span>
        </div>

        <div className="card p-4 border-l-4 border-l-orange-500">
          <span className="text-xs text-muted-foreground">31 – 60 Days Overdue</span>
          <div className="text-xl font-bold font-mono text-orange-600 mt-1">
            {formatCurrency(summary.days60)}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Escalated collection</span>
        </div>

        <div className="card p-4 border-l-4 border-l-rose-500">
          <span className="text-xs text-muted-foreground">90+ Days Critical</span>
          <div className="text-xl font-bold font-mono text-rose-600 mt-1">
            {formatCurrency(summary.days90Plus)}
          </div>
          <span className="text-[10px] text-rose-600 font-medium mt-1 block">High credit risk</span>
        </div>
      </div>

      {/* AR Invoices Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">Unsettled Receivables Breakdown</h2>
          <span className="text-xs text-muted-foreground">{items.length} Pending Invoices</span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client Company</th>
                <th>Due Date</th>
                <th>Aging Bracket</th>
                <th>Overdue Days</th>
                <th>Total Invoiced</th>
                <th>Outstanding Balance</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    All accounts receivable are fully collected. Zero overdue invoices!
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id} className="hover:bg-muted/40 transition-colors">
                    <td>
                      <span className="font-semibold text-foreground text-sm font-mono">
                        {it.invoiceNumber}
                      </span>
                    </td>
                    <td>
                      <div className="font-medium text-foreground text-sm flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <Link href={`/customers/companies/${it.company.id}`} className="hover:text-primary">
                          {it.company.name}
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
                        className={`capitalize text-xs font-mono ${
                          it.bucket === "current"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : it.bucket === "1-30 days"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : "bg-rose-500/10 text-rose-600 border-rose-500/20 font-semibold"
                        }`}
                      >
                        {it.bucket}
                      </Badge>
                    </td>
                    <td>
                      <span className={`text-xs font-mono font-medium ${it.overdueDays > 0 ? "text-rose-600" : "text-muted-foreground"}`}>
                        {it.overdueDays > 0 ? `${it.overdueDays} days late` : "On schedule"}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatCurrency(it.total)}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-sm font-bold text-rose-600">
                        {formatCurrency(it.outstanding)}
                      </span>
                    </td>
                    <td className="text-right">
                      <Link href={`/accounting/invoices`}>
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
