"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CreditCard,
  Plus,
  Building2,
  FileText,
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
import { createPayment } from "../actions"

interface PaymentItem {
  id: string
  businessId: string
  amount: number
  paymentDate: string
  paymentMethod: string
  reference: string | null
  notes: string | null
  status: string
  company: { id: string; name: string; businessId: string }
  invoice: { id: string; businessId: string; invoiceNumber: string } | null
  createdAt: string
}

interface PaymentsClientProps {
  payments: PaymentItem[]
  options: {
    companies: { id: string; name: string; businessId: string }[]
    invoices: { id: string; businessId: string; invoiceNumber: string; outstanding: number; companyId: string }[]
  }
  permissions: string[]
}

export function PaymentsClient({ payments, options, permissions }: PaymentsClientProps) {
  const router = useRouter()
  const canEdit = hasPermission(permissions, "invoices.edit")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [companyId, setCompanyId] = useState("")
  const [invoiceId, setInvoiceId] = useState("")
  const [amount, setAmount] = useState<number | string>("")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0])
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !amount) {
      setError("Please fill all required fields")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await createPayment({
        companyId,
        invoiceId: invoiceId || undefined,
        amount: Number(amount),
        paymentDate,
        paymentMethod,
        reference: reference || undefined,
        notes: notes || undefined,
      })
      if (res.success) {
        setIsDialogOpen(false)
        router.refresh()
      } else {
        setError(res.error || "Failed to record payment")
      }
    } catch (err: any) {
      setError(err.message || "Failed to record payment")
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = options.invoices.filter((inv) => !companyId || inv.companyId === companyId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            Payments & Collections
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Log client remittances, match against outstanding invoices, and update balances
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Record Payment Received
          </Button>
        )}
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <span className="text-xs text-muted-foreground">Total Payments Logged</span>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            {formatCurrency(totalCollected)}
          </div>
        </div>
        <div className="card p-4">
          <span className="text-xs text-muted-foreground">Transactions Count</span>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            {payments.length} Remittances
          </div>
        </div>
        <div className="card p-4">
          <span className="text-xs text-muted-foreground">Primary Remittance Mode</span>
          <div className="text-xl font-bold text-primary mt-1 capitalize">
            Corporate Bank Transfer
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt ID</th>
                <th>Client Company</th>
                <th>Linked Invoice</th>
                <th>Remitted Amount</th>
                <th>Payment Mode</th>
                <th>Reference / Cheque #</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No payments recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                    <td>
                      <span className="font-mono text-xs font-semibold text-primary">
                        {p.businessId}
                      </span>
                    </td>
                    <td>
                      <div className="font-medium text-foreground text-sm flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <Link href={`/customers/companies/${p.company.id}`} className="hover:text-primary">
                          {p.company.name}
                        </Link>
                      </div>
                    </td>
                    <td>
                      {p.invoice ? (
                        <span className="font-mono text-xs text-foreground font-medium">
                          {p.invoice.invoiceNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Advance / On-Account</span>
                      )}
                    </td>
                    <td>
                      <span className="font-mono text-sm font-bold text-emerald-600">
                        {formatCurrency(p.amount)}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground capitalize">
                        {p.paymentMethod.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-mono text-muted-foreground">
                        {p.reference || "—"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(p.paymentDate)}
                      </div>
                    </td>
                    <td>
                      <Badge variant="outline" className="capitalize text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Record Client Payment Received
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
              <Label className="text-xs">Apply to Invoice</Label>
              <select
                value={invoiceId}
                onChange={(e) => {
                  setInvoiceId(e.target.value)
                  const targetInv = options.invoices.find((i) => i.id === e.target.value)
                  if (targetInv && !amount) {
                    setAmount(targetInv.outstanding)
                  }
                }}
                className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select Invoice (Optional)...</option>
                {filteredInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} (Outstanding: {formatCurrency(inv.outstanding)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Amount Received (AED) *</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Payment Date *</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Payment Method</Label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="bank_transfer">Bank Transfer (WPS/SWIFT)</option>
                  <option value="cheque">Company Cheque</option>
                  <option value="online">Online Payment</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Bank Ref / Cheque #</Label>
                <Input
                  placeholder="e.g. TXN-998822"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea
                rows={2}
                placeholder="Bank account credited, deposit slip details..."
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
                Confirm Payment Receipt
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
