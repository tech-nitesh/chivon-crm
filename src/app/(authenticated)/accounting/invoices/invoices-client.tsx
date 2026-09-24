"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  FileText,
  Plus,
  Search,
  Building2,
  TrendingUp,
  FolderKanban,
  Calendar,
  Loader2,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatCurrency, formatDate } from "@/lib/utils"
import { hasPermission } from "@/lib/permissions"
import { createInvoice, updateInvoiceStatus } from "../actions"

interface InvoiceItem {
  id: string
  businessId: string
  invoiceNumber: string
  company: { id: string; name: string; businessId: string }
  project: { id: string; businessId: string; title: string } | null
  invoiceDate: string
  dueDate: string
  subtotal: number
  taxAmount: number
  total: number
  paidAmount: number
  outstanding: number
  status: string
  syncStatus: string
  itemsCount: number
  paymentsCount: number
  createdAt: string
}

interface InvoicesClientProps {
  invoices: InvoiceItem[]
  options: {
    companies: { id: string; name: string; businessId: string }[]
    projects: { id: string; businessId: string; title: string; companyId: string }[]
  }
  search: string
  status: string
  permissions: string[]
}

const statusBadgeStyles: Record<string, string> = {
  draft: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  sent: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  partially_paid: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold",
  overdue: "bg-rose-500/10 text-rose-600 border-rose-500/20 font-semibold",
  cancelled: "bg-gray-500/10 text-gray-500 border-gray-500/20",
}

export function InvoicesClient({
  invoices,
  options,
  search: initialSearch,
  status: initialStatus,
  permissions,
}: InvoicesClientProps) {
  const router = useRouter()
  const canCreate = hasPermission(permissions, "invoices.create")
  const canEdit = hasPermission(permissions, "invoices.edit")

  const [search, setSearch] = useState(initialSearch)
  const [status, setStatus] = useState(initialStatus)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Invoice Form State
  const [companyId, setCompanyId] = useState("")
  const [projectId, setProjectId] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`)
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  )
  const [notes, setNotes] = useState("Payment due within 30 days. Transfer to official corporate bank account.")
  const [items, setItems] = useState([
    {
      description: "Project Milestone Billing: Delivery & Installation Complete",
      quantity: 1,
      unitPrice: 85000,
      taxRate: 5,
    },
  ])

  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0)
  const taxAmount = subtotal * 0.05
  const grandTotal = subtotal + taxAmount

  const handleFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const p = new URLSearchParams()
    if (search) p.set("search", search)
    if (status !== "all") p.set("status", status)
    router.push(`/accounting/invoices?${p.toString()}`)
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setLoadingId(id)
      await updateInvoiceStatus(id, newStatus)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingId(null)
    }
  }

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, taxRate: 5 }])
  }

  const removeItem = (idx: number) => {
    const updated = [...items]
    updated.splice(idx, 1)
    setItems(updated)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !invoiceNumber) {
      setError("Please select a company and enter an invoice number")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await createInvoice({
        companyId,
        projectId: projectId || undefined,
        invoiceNumber,
        invoiceDate,
        dueDate,
        notes,
        items,
      })
      if (res.success) {
        setIsDialogOpen(false)
        router.refresh()
      } else {
        setError(res.error || "Failed to generate invoice")
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate invoice")
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = options.projects.filter(
    (p) => !companyId || p.companyId === companyId
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Tax Invoices & AR Billing
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Issue FTA-compliant UAE Tax Invoices and monitor client account balances
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Tax Invoice
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice number, ID, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              const p = new URLSearchParams()
              if (search) p.set("search", search)
              if (e.target.value !== "all") p.set("status", e.target.value)
              router.push(`/accounting/invoices?${p.toString()}`)
            }}
            className="px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>
      </div>

      {/* Invoices Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Company & Project</th>
                <th>Due Date</th>
                <th>Total (AED)</th>
                <th>Paid Amount</th>
                <th>Outstanding</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No tax invoices recorded.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/40 transition-colors">
                    <td>
                      <span className="font-semibold text-foreground text-sm font-mono">
                        {inv.invoiceNumber}
                      </span>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {inv.businessId}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-foreground text-sm flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <Link href={`/customers/companies/${inv.company.id}`} className="hover:text-primary">
                          {inv.company.name}
                        </Link>
                      </div>
                      {inv.project && (
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 font-mono">
                          <FolderKanban className="w-3 h-3 text-purple-600" />
                          {inv.project.businessId}: {inv.project.title}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(inv.dueDate)}
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-sm font-bold text-foreground">
                        {formatCurrency(inv.total)}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-emerald-600 font-medium">
                        {formatCurrency(inv.paidAmount)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`font-mono text-xs font-semibold ${
                          inv.outstanding > 0 ? "text-rose-600" : "text-muted-foreground"
                        }`}
                      >
                        {formatCurrency(inv.outstanding)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={inv.status}
                          disabled={!canEdit || loadingId === inv.id}
                          onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-md border border-input focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer capitalize ${statusBadgeStyles[inv.status] || "bg-muted text-foreground"}`}
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="partially_paid">Partially Paid</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        {loadingId === inv.id && (
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

      {/* Create Invoice Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Generate Official UAE Tax Invoice
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Client Company *</Label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">Select Company...</option>
                  {options.companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.businessId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs">Link Project</Label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select Project (Optional)...</option>
                  {filteredProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.businessId}: {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs">Invoice Number *</Label>
                <Input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="mt-1.5 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Issue Date</Label>
                <Input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Billed Deliverables & Milestones</h3>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="text-xs">
                  + Add Item
                </Button>
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs border border-border p-2 rounded-md bg-muted/20">
                  <div className="col-span-6">
                    <Label className="text-[10px] text-muted-foreground">Description</Label>
                    <Input
                      placeholder="Milestone description"
                      value={item.description}
                      onChange={(e) => {
                        const updated = [...items]
                        updated[idx].description = e.target.value
                        setItems(updated)
                      }}
                      className="h-8 text-xs mt-1"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[10px] text-muted-foreground">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...items]
                        updated[idx].quantity = Number(e.target.value) || 0
                        setItems(updated)
                      }}
                      className="h-8 text-xs mt-1"
                      required
                    />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-[10px] text-muted-foreground">Price (AED)</Label>
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const updated = [...items]
                        updated[idx].unitPrice = Number(e.target.value) || 0
                        setItems(updated)
                      }}
                      className="h-8 text-xs mt-1"
                      required
                    />
                  </div>
                  <div className="col-span-1 text-right pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={items.length === 1}
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      onClick={() => removeItem(idx)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="p-3 rounded-lg bg-muted border border-border flex justify-between items-center text-xs font-mono">
              <div>Net: <span className="font-bold">{formatCurrency(subtotal)}</span></div>
              <div>VAT (5%): <span className="font-bold">{formatCurrency(taxAmount)}</span></div>
              <div className="text-sm font-bold text-primary">Total: {formatCurrency(grandTotal)}</div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Issue Tax Invoice
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
