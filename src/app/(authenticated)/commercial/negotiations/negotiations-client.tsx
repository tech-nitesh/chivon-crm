"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Handshake,
  Plus,
  Building2,
  TrendingUp,
  FileText,
  Loader2,
  AlertCircle,
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
import { createNegotiation } from "../actions"

interface NegotiationItem {
  id: string
  quotationId: string
  quotationBusinessId: string
  companyName: string
  opportunityTitle: string | null
  originalAmount: number
  customerRequest: string | null
  priceChange: string | null
  discountReq: string | null
  paymentTerms: string | null
  status: string
  internalNotes: string | null
  createdAt: string
}

interface NegotiationsClientProps {
  negotiations: NegotiationItem[]
  options: {
    quotations: { id: string; businessId: string; companyId: string }[]
    opportunities: { id: string; businessId: string; title: string; companyId: string }[]
  }
  permissions: string[]
}

export function NegotiationsClient({
  negotiations,
  options,
  permissions,
}: NegotiationsClientProps) {
  const router = useRouter()
  const canEdit = hasPermission(permissions, "quotations.edit")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [quotationId, setQuotationId] = useState("")
  const [opportunityId, setOpportunityId] = useState("")
  const [customerRequest, setCustomerRequest] = useState("")
  const [discountReq, setDiscountReq] = useState("")
  const [priceChange, setPriceChange] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("")
  const [internalNotes, setInternalNotes] = useState("")

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quotationId) {
      setError("Please select a quotation")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await createNegotiation({
        quotationId,
        opportunityId: opportunityId || undefined,
        customerRequest,
        discountReq,
        priceChange,
        paymentTerms,
        internalNotes,
      })
      if (res.success) {
        setIsDialogOpen(false)
        router.refresh()
      } else {
        setError("Failed to log negotiation round")
      }
    } catch (err: any) {
      setError(err.message || "Failed to log negotiation")
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
            <Handshake className="w-6 h-6 text-primary" />
            Commercial Negotiations & Concessions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track client counter-offers, requested discounts, and margin trade-offs
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Log Negotiation Round
          </Button>
        )}
      </div>

      {/* Negotiations List */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Quote Reference</th>
                <th>Company</th>
                <th>Original Amount</th>
                <th>Client Request / Counter-Offer</th>
                <th>Requested Discount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {negotiations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Handshake className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No commercial negotiations recorded.
                  </td>
                </tr>
              ) : (
                negotiations.map((n) => (
                  <tr key={n.id} className="hover:bg-muted/40 transition-colors">
                    <td>
                      <span className="font-mono text-xs font-semibold text-primary">
                        {n.quotationBusinessId}
                      </span>
                    </td>
                    <td>
                      <div className="font-medium text-foreground text-sm flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        {n.companyName}
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-sm font-medium">
                        {formatCurrency(n.originalAmount)}
                      </span>
                    </td>
                    <td>
                      <div className="text-xs text-foreground font-medium">
                        {n.customerRequest || "Price concession requested"}
                      </div>
                      {n.internalNotes && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Note: {n.internalNotes}
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge variant="outline" className="font-mono text-xs text-amber-600 bg-amber-500/10">
                        {n.discountReq || "N/A"}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {n.status}
                      </Badge>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground">{formatDate(n.createdAt)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Negotiation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Handshake className="w-5 h-5 text-primary" />
              Log Commercial Negotiation
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label className="text-xs">Select Quotation *</Label>
              <select
                value={quotationId}
                onChange={(e) => setQuotationId(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">Choose quotation...</option>
                {options.quotations.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.businessId}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs">Customer Request / Feedback</Label>
              <Input
                placeholder="e.g. Client requested 8% reduction due to budget cap"
                value={customerRequest}
                onChange={(e) => setCustomerRequest(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Discount Requested</Label>
                <Input
                  placeholder="e.g. 8% or 15,000 AED"
                  value={discountReq}
                  onChange={(e) => setDiscountReq(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-xs">Target Counter Price (AED)</Label>
                <Input
                  placeholder="e.g. 185000"
                  value={priceChange}
                  onChange={(e) => setPriceChange(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Payment Terms Under Discussion</Label>
              <Input
                placeholder="e.g. 50% advance, 50% upon delivery"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-xs">Internal Notes / Strategy</Label>
              <Textarea
                rows={2}
                placeholder="e.g. Can accept 5% if client commits to annual maintenance contract"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                className="mt-1.5 text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Negotiation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
