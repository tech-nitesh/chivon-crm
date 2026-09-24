"use client"

import React from "react"
import {
  Calculator,
  ShieldCheck,
  FileCheck,
  Building2,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

interface TaxClientProps {
  data: {
    taxableSupplies: number
    outputTax: number
    taxablePurchases: number
    inputTax: number
    netVatPayable: number
  }
  permissions: string[]
}

export function TaxClient({ data }: TaxClientProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary" />
            UAE VAT 201 Tax Return Declaration
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Official FTA-aligned Value Added Tax calculation (5% Standard UAE Rate)
          </p>
        </div>
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold px-3 py-1 self-start">
          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
          FTA TRN: 100488299100003
        </Badge>
      </div>

      {/* Main Net VAT Summary Card */}
      <div className="card p-6 bg-gradient-to-r from-emerald-950/20 via-background to-background border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Box 13: Net VAT Payable to Federal Tax Authority (FTA)
            </span>
            <div className="text-3xl font-extrabold font-mono text-emerald-600 mt-1">
              {formatCurrency(data.netVatPayable)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Output Tax (Box 1) minus Recoverable Input Tax (Box 9)
            </p>
          </div>
          <Button className="gap-2 self-start sm:self-auto">
            <FileCheck className="w-4 h-4" />
            Generate FTA Form 201
          </Button>
        </div>
      </div>

      {/* Tax Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Output VAT (Sales) */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span>Output Tax on Supplies & Sales (Box 1)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            VAT charged to clients on taxable industrial goods, engineering works, and installation services.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center text-sm border-b border-border pb-2">
              <span className="text-muted-foreground">Taxable Sales (Standard 5%):</span>
              <span className="font-mono font-bold">{formatCurrency(data.taxableSupplies)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-semibold">
              <span>Total Output VAT Due (5%):</span>
              <span className="font-mono text-primary font-bold">{formatCurrency(data.outputTax)}</span>
            </div>
          </div>
        </div>

        {/* Input VAT (Expenses & Purchases) */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <TrendingDown className="w-5 h-5 text-emerald-600" />
            <span>Recoverable Input Tax on Purchases (Box 9)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            VAT paid to registered suppliers and vendors for raw materials, workshop tools, and project expenses.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center text-sm border-b border-border pb-2">
              <span className="text-muted-foreground">Taxable Purchases & OPEX:</span>
              <span className="font-mono font-bold">{formatCurrency(data.taxablePurchases)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-semibold">
              <span>Total Input VAT Recoverable (5%):</span>
              <span className="font-mono text-emerald-600 font-bold">{formatCurrency(data.inputTax)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Notice */}
      <div className="p-4 rounded-lg bg-muted border border-border text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground">UAE Federal Decree-Law No. (8) on Value Added Tax:</strong> All registered taxable persons must submit VAT returns within 28 days following the end of the tax period. Ensure all tax invoices issued and received contain mandatory Arabic and English tax invoice headers, TRN numbers, and line-itemized VAT computations.
      </div>
    </div>
  )
}
