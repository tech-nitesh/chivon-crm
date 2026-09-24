"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Receipt,
  Plus,
  FolderKanban,
  Calendar,
  Loader2,
  DollarSign,
  User,
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
import { createExpense, updateExpenseStatus } from "../actions"

interface ExpenseItem {
  id: string
  businessId: string
  date: string
  category: string
  employeeName: string | null
  vendorName: string | null
  amount: number
  taxAmount: number
  description: string | null
  status: string
  project: { id: string; businessId: string; title: string } | null
  createdAt: string
}

interface ExpensesClientProps {
  expenses: ExpenseItem[]
  options: {
    projects: { id: string; businessId: string; title: string }[]
  }
  permissions: string[]
}

const statusBadgeStyles: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  approved: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  reimbursed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold",
  rejected: "bg-rose-500/10 text-rose-600 border-rose-500/20",
}

export function ExpensesClient({ expenses, options, permissions }: ExpensesClientProps) {
  const router = useRouter()
  const canCreate = hasPermission(permissions, "expenses.create")
  const canApprove = hasPermission(permissions, "expenses.approve")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [category, setCategory] = useState("materials")
  const [amount, setAmount] = useState<number | string>("")
  const [taxAmount, setTaxAmount] = useState<number | string>("")
  const [employeeName, setEmployeeName] = useState("")
  const [vendorName, setVendorName] = useState("")
  const [projectId, setProjectId] = useState("")
  const [description, setDescription] = useState("")

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setLoadingId(id)
      await updateExpenseStatus(id, newStatus)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingId(null)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !category) {
      setError("Please fill required fields")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await createExpense({
        date,
        category,
        amount: Number(amount),
        taxAmount: taxAmount ? Number(taxAmount) : undefined,
        employeeName: employeeName || undefined,
        vendorName: vendorName || undefined,
        projectId: projectId || undefined,
        description: description || undefined,
      })
      if (res.success) {
        setIsDialogOpen(false)
        router.refresh()
      } else {
        setError(res.error || "Failed to log expense")
      }
    } catch (err: any) {
      setError(err.message || "Failed to log expense")
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
            <Receipt className="w-6 h-6 text-primary" />
            Operational Expenses & Cost Tracking
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track site logistics, project consumables, workshop parts, and claimable VAT
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Record Expense
          </Button>
        )}
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <span className="text-xs text-muted-foreground">Total OPEX Incurred</span>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            {formatCurrency(totalExpenses)}
          </div>
        </div>
        <div className="card p-4">
          <span className="text-xs text-muted-foreground">Total Expense Entries</span>
          <div className="text-xl font-bold font-mono text-primary mt-1">
            {expenses.length} Records
          </div>
        </div>
        <div className="card p-4">
          <span className="text-xs text-muted-foreground">Input VAT Claimable</span>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            {formatCurrency(expenses.reduce((sum, e) => sum + e.taxAmount, 0))}
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Expense ID</th>
                <th>Category</th>
                <th>Description</th>
                <th>Vendor / Employee</th>
                <th>Project Link</th>
                <th>Net Amount</th>
                <th>VAT Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted-foreground">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No operational expenses recorded.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/40 transition-colors">
                    <td>
                      <span className="font-mono text-xs font-semibold text-primary">
                        {e.businessId}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {e.category.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <div className="text-xs text-foreground font-medium max-w-[220px] truncate">
                        {e.description || "General project expense"}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground">
                        {e.vendorName || e.employeeName || "Internal"}
                      </span>
                    </td>
                    <td>
                      {e.project ? (
                        <div className="text-xs font-mono text-purple-600 flex items-center gap-1">
                          <FolderKanban className="w-3 h-3" />
                          {e.project.businessId}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Overhead</span>
                      )}
                    </td>
                    <td>
                      <span className="font-mono text-sm font-bold text-foreground">
                        {formatCurrency(e.amount)}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatCurrency(e.taxAmount)}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground">{formatDate(e.date)}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={e.status}
                          disabled={!canApprove || loadingId === e.id}
                          onChange={(ev) => handleStatusChange(e.id, ev.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-md border border-input focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer capitalize ${statusBadgeStyles[e.status] || "bg-muted text-foreground"}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="reimbursed">Reimbursed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        {loadingId === e.id && (
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

      {/* Record Expense Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Record Operational Expense
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category *</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring capitalize"
                >
                  <option value="materials">Raw Materials / Components</option>
                  <option value="travel">Field Travel & Fuel</option>
                  <option value="tools">Workshop Tools & Safety Gear</option>
                  <option value="logistics">Freight & Clearance</option>
                  <option value="utilities">Utilities & Office</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Date *</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Amount (AED) *</Label>
                <Input
                  type="number"
                  placeholder="e.g. 4500"
                  value={amount}
                  onChange={(e) => {
                    const amt = Number(e.target.value) || 0
                    setAmount(e.target.value)
                    setTaxAmount((amt * 0.05).toFixed(2))
                  }}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">VAT Amount (5%)</Label>
                <Input
                  type="number"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Vendor Name</Label>
                <Input
                  placeholder="e.g. Al Futtaim Auto"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-xs">Claimed By (Employee)</Label>
                <Input
                  placeholder="e.g. Tariq Mansoor"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Link Project</Label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">General Overhead (No Project)</option>
                {options.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.businessId}: {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs">Description</Label>
              <Textarea
                rows={2}
                placeholder="Details of expense, purpose, receipt details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1.5 text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Log Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
