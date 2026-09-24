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
  User,
  Loader2,
  DollarSign,
  Trash2,
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
import { createQuotation, updateQuotationStatus } from "../actions"

interface QuotationItemData {
  id: string
  businessId: string
  company: { id: string; name: string; businessId: string }
  contact: string | null
  opportunity: { id: string; businessId: string; title: string } | null
  status: string
  currentRevision: number
  validityDays: number
  paymentTerms: string | null
  subtotal: number
  taxAmount: number
  grandTotal: number
  itemsCount: number
  createdAt: string
}

interface QuotationsClientProps {
  quotations: QuotationItemData[]
  options: {
    companies: { id: string; name: string; businessId: string }[]
    contacts: { id: string; firstName: string; lastName: string; companyId: string }[]
    opportunities: { id: string; businessId: string; title: string; companyId: string }[]
  }
  search: string
  status: string
  permissions: string[]
}

const statusBadgeStyles: Record<string, string> = {
  draft: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  pending_approval: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  approved: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  sent: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  accepted: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold",
  rejected: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  expired: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
}

export function QuotationsClient({
  quotations,
  options,
  search: initialSearch,
  status: initialStatus,
  permissions,
}: QuotationsClientProps) {
  const router = useRouter()
  const canCreate = hasPermission(permissions, "quotations.create")
  const canEdit = hasPermission(permissions, "quotations.edit")

  const [search, setSearch] = useState(initialSearch)
  const [status, setStatus] = useState(initialStatus)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Quotation form
  const [companyId, setCompanyId] = useState("")
  const [contactId, setContactId] = useState("")
  const [opportunityId, setOpportunityId] = useState("")
  const [validityDays, setValidityDays] = useState(30)
  const [paymentTerms, setPaymentTerms] = useState("30 days net from invoice")
  const [deliveryTerms, setDeliveryTerms] = useState("Ex-Works / FOB UAE")
  const [termsAndConditions, setTermsAndConditions] = useState(
    "1. Prices are in AED, inclusive of standard industrial warranty (12 months).\n2. Standard UAE VAT (5%) applies.\n3. Delivery timeframe: 4-6 weeks from receipt of official PO."
  )
  const [items, setItems] = useState([
    {
      description: "Industrial Automation Integration & Commissioning",
      quantity: 1,
      unit: "lump_sum",
      unitPrice: 45000,
      discount: 0,
      taxRate: 5,
      notes: "Includes PLC software development, panel wiring, and on-site testing",
    },
  ])

  // Calculation
  const subtotal = items.reduce(
    (sum, it) => sum + it.quantity * it.unitPrice * (1 - (it.discount || 0) / 100),
    0
  )
  const vatAmount = subtotal * 0.05
  const grandTotal = subtotal + vatAmount

  const handleFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const p = new URLSearchParams()
    if (search) p.set("search", search)
    if (status !== "all") p.set("status", status)
    router.push(`/commercial/quotations?${p.toString()}`)
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setLoadingId(id)
      await updateQuotationStatus(id, newStatus)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingId(null)
    }
  }

  const addItem = () => {
    setItems([
      ...items,
      {
        description: "",
        quantity: 1,
        unit: "nos",
        unitPrice: 0,
        discount: 0,
        taxRate: 5,
        notes: "",
      },
    ])
  }

  const removeItem = (idx: number) => {
    const updated = [...items]
    updated.splice(idx, 1)
    setItems(updated)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) {
      setError("Please select a company")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await createQuotation({
        companyId,
        contactId: contactId || undefined,
        opportunityId: opportunityId || undefined,
        validityDays: Number(validityDays) || 30,
        paymentTerms,
        deliveryTerms,
        termsAndConditions,
        items,
      })
      if (res.success) {
        setIsDialogOpen(false)
        router.refresh()
      } else {
        setError(res.error || "Failed to create quotation")
      }
    } catch (err: any) {
      setError(err.message || "Failed to create quotation")
    } finally {
      setLoading(false)
    }
  }

  const filteredContacts = options.contacts.filter((c) => !companyId || c.companyId === companyId)
  const filteredOpps = options.opportunities.filter((o) => !companyId || o.companyId === companyId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Quotations & Estimates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate industrial price offers, itemized cost proposals, and client bids
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Quotation
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by Quotation ID, company, or opportunity..."
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
              router.push(`/commercial/quotations?${p.toString()}`)
            }}
            className="px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="sent">Sent to Client</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>
      </div>

      {/* Quotations Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Quote Ref</th>
                <th>Company & Opportunity</th>
                <th>Subtotal</th>
                <th>VAT (5%)</th>
                <th>Total (AED)</th>
                <th>Status</th>
                <th>Rev</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No commercial quotations found.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-muted/40 transition-colors">
                    <td>
                      <span className="font-mono text-xs font-semibold text-primary">
                        {q.businessId}
                      </span>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {q.itemsCount} line items
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-foreground text-sm flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <Link href={`/customers/companies/${q.company.id}`} className="hover:text-primary">
                          {q.company.name}
                        </Link>
                      </div>
                      {q.opportunity && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground font-mono">
                          <TrendingUp className="w-3 h-3 text-purple-600" />
                          <Link href={`/sales/opportunities/${q.opportunity.id}`} className="hover:underline">
                            {q.opportunity.businessId}: {q.opportunity.title}
                          </Link>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatCurrency(q.subtotal)}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatCurrency(q.taxAmount)}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-sm font-bold text-foreground">
                        {formatCurrency(q.grandTotal)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={q.status}
                          disabled={!canEdit || loadingId === q.id}
                          onChange={(e) => handleStatusChange(q.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-md border border-input focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer capitalize ${statusBadgeStyles[q.status] || "bg-muted text-foreground"}`}
                        >
                          <option value="draft">Draft</option>
                          <option value="pending_approval">Pending Approval</option>
                          <option value="approved">Approved</option>
                          <option value="sent">Sent</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                          <option value="expired">Expired</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        {loadingId === q.id && (
                          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        R{q.currentRevision}
                      </Badge>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground">{formatDate(q.createdAt)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Quotation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Generate Commercial Quotation
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-5">
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
                <Label className="text-xs">Contact Person</Label>
                <select
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select Contact...</option>
                  {filteredContacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs">Link Opportunity</Label>
                <select
                  value={opportunityId}
                  onChange={(e) => setOpportunityId(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select Opportunity...</option>
                  {filteredOpps.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.businessId}: {o.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Scope of Supply / Bill of Quantities</h3>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="text-xs">
                  + Add Line Item
                </Button>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs border border-border p-2 rounded-md bg-muted/20">
                    <div className="col-span-5">
                      <Label className="text-[10px] text-muted-foreground">Description & Deliverables</Label>
                      <Input
                        placeholder="Item description"
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
                    <div className="col-span-1">
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
                    <div className="col-span-2">
                      <Label className="text-[10px] text-muted-foreground">Unit</Label>
                      <Input
                        placeholder="e.g. set / nos / hrs"
                        value={item.unit}
                        onChange={(e) => {
                          const updated = [...items]
                          updated[idx].unit = e.target.value
                          setItems(updated)
                        }}
                        className="h-8 text-xs mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-[10px] text-muted-foreground">Unit Price (AED)</Label>
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
                    <div className="col-span-1">
                      <Label className="text-[10px] text-muted-foreground">Disc %</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount}
                        onChange={(e) => {
                          const updated = [...items]
                          updated[idx].discount = Number(e.target.value) || 0
                          setItems(updated)
                        }}
                        className="h-8 text-xs mt-1"
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
            </div>

            {/* Terms and Financials */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Validity (Days)</Label>
                    <Input
                      type="number"
                      value={validityDays}
                      onChange={(e) => setValidityDays(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Delivery Terms</Label>
                    <Input
                      value={deliveryTerms}
                      onChange={(e) => setDeliveryTerms(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Payment Terms</Label>
                  <Input
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Summary Box */}
              <div className="p-4 rounded-lg bg-muted border border-border flex flex-col justify-between">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net Subtotal:</span>
                    <span className="font-mono font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">UAE VAT (5%):</span>
                    <span className="font-mono font-medium">{formatCurrency(vatAmount)}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
                    <span>Grand Total:</span>
                    <span className="text-primary font-mono">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Generate Official Quotation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
