"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  FileSpreadsheet,
  Plus,
  Building2,
  Calendar,
  Loader2,
  DollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatCurrency, formatDate } from "@/lib/utils"
import { hasPermission } from "@/lib/permissions"
import { createBill, updateBillStatus } from "../actions"

interface BillItem {
  id: string
  businessId: string
  billNumber: string
  billDate: string
  dueDate: string
  amount: number
  paidAmount: number
  outstanding: number
  status: string
  notes: string | null
  vendor: { id: string; name: string; businessId: string }
  createdAt: string
}

interface BillsClientProps {
  bills: BillItem[]
  options: {
    vendors: { id: string; name: string; businessId: string }[]
  }
  permissions: string[]
}

const statusBadgeStyles: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  partially_paid: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold",
  overdue: "bg-rose-500/10 text-rose-600 border-rose-500/20 font-semibold",
  cancelled: "bg-gray-500/10 text-gray-500 border-gray-500/20",
}

export function BillsClient({ bills, options, permissions }: BillsClientProps) {
  const router = useRouter()
  const canCreate = hasPermission(permissions, "expenses.create")
  const canApprove = hasPermission(permissions, "expenses.approve")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [vendorId, setVendorId] = useState("")
  const [billNumber, setBillNumber] = useState("")
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  )
  const [amount, setAmount] = useState<number | string>("")
  const [notes, setNotes] = useState("")

  const totalPayable = bills.reduce((sum, b) => sum + b.outstanding, 0)

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setLoadingId(id)
      await updateBillStatus(id, newStatus)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingId(null)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendorId || !billNumber || !amount) {
      setError("Please fill all required fields")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await createBill({
        vendorId,
        billNumber,
        billDate,
        dueDate,
        amount: Number(amount),
        notes: notes || undefined,
      })
      if (res.success) {
        setIsDialogOpen(false)
        router.refresh()
      } else {
        setError(res.error || "Failed to record vendor bill")
      }
    } catch (err: any) {
      setError(err.message || "Failed to record bill")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-primary" />
            Supplier Bills & Payables
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage vendor invoices, payment obligations, and procurement payables
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Enter Vendor Bill
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <span className="text-xs text-muted-foreground">Total Accounts Payable (AP)</span>
          <div className="text-xl font-bold font-mono text-rose-600 mt-1">
            {formatCurrency(totalPayable)}
          </div>
        </div>
        <div className="card p-4">
          <span className="text-xs text-muted-foreground">Total Bills In System</span>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            {bills.length} Invoices
          </div>
        </div>
        <div className="card p-4">
          <span className="text-xs text-muted-foreground">Active Approved Vendors</span>
          <div className="text-xl font-bold font-mono text-primary mt-1">
            {options.vendors.length} Vendors
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bill #</th>
                <th>Supplier / Vendor</th>
                <th>Due Date</th>
                <th>Bill Amount</th>
                <th>Paid Amount</th>
                <th>Outstanding Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No supplier bills recorded yet.
                  </td>
                </tr>
              ) : (
                bills.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/40 transition-colors">
                    <td>
                      <span className="font-semibold text-foreground text-sm font-mono">
                        {b.billNumber}
                      </span>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {b.businessId}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-foreground text-sm flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <Link href={`/procurement/vendors`} className="hover:text-primary">
                          {b.vendor.name}
                        </Link>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(b.dueDate)}
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-sm font-bold text-foreground">
                        {formatCurrency(b.amount)}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-emerald-600 font-medium">
                        {formatCurrency(b.paidAmount)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`font-mono text-xs font-semibold ${
                          b.outstanding > 0 ? "text-rose-600" : "text-muted-foreground"
                        }`}
                      >
                        {formatCurrency(b.outstanding)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={b.status}
                          disabled={!canApprove || loadingId === b.id}
                          onChange={(e) => handleStatusChange(b.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-md border border-input focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer capitalize ${statusBadgeStyles[b.status] || "bg-muted text-foreground"}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="partially_paid">Partially Paid</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        {loadingId === b.id && (
                          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Bill Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Register Supplier Bill
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label className="text-xs">Supplier / Vendor *</Label>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">Select Vendor...</option>
                {options.vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.businessId})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Supplier Bill # *</Label>
                <Input
                  placeholder="e.g. INV-ABB-9921"
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Bill Amount (AED) *</Label>
                <Input
                  type="number"
                  placeholder="e.g. 28000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Bill Date *</Label>
                <Input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Payment Due Date *</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Notes / Purchase Order Ref</Label>
              <Textarea
                rows={2}
                placeholder="Linked PO number, material batch details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1.5 text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Log Supplier Bill
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
