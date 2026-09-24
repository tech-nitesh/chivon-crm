"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ShoppingBag,
  Plus,
  Building2,
  TrendingUp,
  FileText,
  Loader2,
  Calendar,
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
import { createPurchaseOrder, updatePOStatus } from "../actions"

interface POItem {
  id: string
  businessId: string
  poNumber: string
  poValue: number
  poDate: string
  status: string
  company: { id: string; name: string; businessId: string }
  quotation: { id: string; businessId: string } | null
  project: { id: string; businessId: string; title: string } | null
  notes: string | null
  createdAt: string
}

interface PurchaseOrdersClientProps {
  orders: POItem[]
  options: {
    companies: { id: string; name: string; businessId: string }[]
    quotations: { id: string; businessId: string; companyId: string }[]
  }
  permissions: string[]
}

const statusBadgeStyles: Record<string, string> = {
  received: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  acknowledged: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  in_progress: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-600 border-rose-500/20",
}

export function PurchaseOrdersClient({
  orders,
  options,
  permissions,
}: PurchaseOrdersClientProps) {
  const router = useRouter()
  const canEdit = hasPermission(permissions, "quotations.edit")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [companyId, setCompanyId] = useState("")
  const [quotationId, setQuotationId] = useState("")
  const [poNumber, setPoNumber] = useState("")
  const [poValue, setPoValue] = useState<number | string>("")
  const [poDate, setPoDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setLoadingId(id)
      await updatePOStatus(id, newStatus)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingId(null)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !poNumber || !poValue) {
      setError("Please fill all required fields")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await createPurchaseOrder({
        companyId,
        quotationId: quotationId || undefined,
        poNumber,
        poValue: Number(poValue),
        poDate,
        notes: notes || undefined,
      })
      if (res.success) {
        setIsDialogOpen(false)
        router.refresh()
      } else {
        setError(res.error || "Failed to log client PO")
      }
    } catch (err: any) {
      setError(err.message || "Failed to log client PO")
    } finally {
      setLoading(false)
    }
  }

  const filteredQuotes = options.quotations.filter(
    (q) => !companyId || q.companyId === companyId
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
            Client Purchase Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Confirmed customer purchase orders received, ready for project kickoff
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Log Client PO
          </Button>
        )}
      </div>

      {/* PO Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>System ID</th>
                <th>Client PO Number</th>
                <th>Company</th>
                <th>Linked Quote</th>
                <th>PO Value (AED)</th>
                <th>PO Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No client purchase orders logged yet.
                  </td>
                </tr>
              ) : (
                orders.map((po) => (
                  <tr key={po.id} className="hover:bg-muted/40 transition-colors">
                    <td>
                      <span className="font-mono text-xs font-semibold text-primary">
                        {po.businessId}
                      </span>
                    </td>
                    <td>
                      <span className="font-semibold text-foreground text-sm font-mono">
                        {po.poNumber}
                      </span>
                    </td>
                    <td>
                      <div className="font-medium text-foreground text-sm flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <Link href={`/customers/companies/${po.company.id}`} className="hover:text-primary">
                          {po.company.name}
                        </Link>
                      </div>
                    </td>
                    <td>
                      {po.quotation ? (
                        <span className="font-mono text-xs text-primary">
                          {po.quotation.businessId}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Direct Order</span>
                      )}
                    </td>
                    <td>
                      <span className="font-mono text-sm font-bold text-foreground">
                        {formatCurrency(po.poValue)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(po.poDate)}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={po.status}
                          disabled={!canEdit || loadingId === po.id}
                          onChange={(e) => handleStatusChange(po.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-md border border-input focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer capitalize ${statusBadgeStyles[po.status] || "bg-muted text-foreground"}`}
                        >
                          <option value="received">Received</option>
                          <option value="acknowledged">Acknowledged</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        {loadingId === po.id && (
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

      {/* Log PO Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Register Client Purchase Order
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
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
              <Label className="text-xs">Linked Quotation</Label>
              <select
                value={quotationId}
                onChange={(e) => setQuotationId(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select Quotation (Optional)...</option>
                {filteredQuotes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.businessId}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Client PO Number *</Label>
                <Input
                  placeholder="e.g. PO-ADNOC-2024-884"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">PO Value (AED) *</Label>
                <Input
                  type="number"
                  placeholder="e.g. 175000"
                  value={poValue}
                  onChange={(e) => setPoValue(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">PO Issue Date</Label>
              <Input
                type="date"
                value={poDate}
                onChange={(e) => setPoDate(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label className="text-xs">Notes / Special Instructions</Label>
              <Textarea
                rows={2}
                placeholder="Scope highlights, delivery timeline conditions..."
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
                Confirm PO Receipt
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
