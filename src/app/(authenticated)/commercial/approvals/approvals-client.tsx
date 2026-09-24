"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  TrendingUp,
  Loader2,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
import { decideQuotationApproval } from "../actions"

interface ApprovalItem {
  id: string
  quotationId: string
  quotationBusinessId: string
  companyName: string
  opportunityTitle: string | null
  grandTotal: number
  status: string
  comments: string | null
  approverName: string
  respondedAt: string | null
  createdAt: string
}

interface ApprovalsClientProps {
  approvals: ApprovalItem[]
  permissions: string[]
}

const statusBadgeStyles: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-600 border-rose-500/20",
}

export function ApprovalsClient({ approvals, permissions }: ApprovalsClientProps) {
  const router = useRouter()
  const canApprove = hasPermission(permissions, "quotations.approve")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null)
  const [decision, setDecision] = useState<"approved" | "rejected">("approved")
  const [comments, setComments] = useState("")
  const [loading, setLoading] = useState(false)

  const openDecisionModal = (approval: ApprovalItem, dec: "approved" | "rejected") => {
    setSelectedApproval(approval)
    setDecision(dec)
    setComments("")
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedApproval) return
    setLoading(true)
    try {
      await decideQuotationApproval(selectedApproval.id, decision, comments)
      setIsDialogOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const pendingCount = approvals.filter((a) => a.status === "pending").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Commercial Approvals Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review margin thresholds, price overrides, and authorize client proposals
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-semibold px-3 py-1">
            {pendingCount} Pending Authorization
          </Badge>
        )}
      </div>

      {/* Approvals Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Quotation Ref</th>
                <th>Company & Opportunity</th>
                <th>Bid Value (AED)</th>
                <th>Authorized Approver</th>
                <th>Status</th>
                <th>Comments</th>
                <th>Requested</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {approvals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No approval requests found in queue.
                  </td>
                </tr>
              ) : (
                approvals.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/40 transition-colors">
                    <td>
                      <span className="font-mono text-xs font-semibold text-primary">
                        {a.quotationBusinessId}
                      </span>
                    </td>
                    <td>
                      <div className="font-medium text-foreground text-sm flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        {a.companyName}
                      </div>
                      {a.opportunityTitle && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {a.opportunityTitle}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="font-mono text-sm font-bold text-foreground">
                        {formatCurrency(a.grandTotal)}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-medium text-foreground">
                        {a.approverName}
                      </span>
                    </td>
                    <td>
                      <Badge
                        variant="outline"
                        className={`capitalize text-xs font-medium ${statusBadgeStyles[a.status] || ""}`}
                      >
                        {a.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="text-xs text-muted-foreground max-w-[200px] line-clamp-2">
                        {a.comments || "—"}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
                    </td>
                    <td className="text-right">
                      {a.status === "pending" && canApprove ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                            onClick={() => openDecisionModal(a, "approved")}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 text-xs gap-1"
                            onClick={() => openDecisionModal(a, "rejected")}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {a.respondedAt ? `Decided ${formatDate(a.respondedAt)}` : "Closed"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {decision === "approved" ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
              {decision === "approved" ? "Authorize Quotation" : "Reject Proposal"} (
              {selectedApproval?.quotationBusinessId})
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-muted rounded-md text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client:</span>
                <span className="font-semibold">{selectedApproval?.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Bid:</span>
                <span className="font-mono font-bold">{formatCurrency(selectedApproval?.grandTotal || 0)}</span>
              </div>
            </div>

            <div>
              <Label className="text-xs">
                {decision === "approved" ? "Approval Notes / Stipulations" : "Rejection Reason"}
              </Label>
              <Textarea
                rows={3}
                placeholder={
                  decision === "approved"
                    ? "e.g. Approved with standard 30-day payment term condition."
                    : "e.g. Margin below 18% floor. Require reduction in supplier components."
                }
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="mt-1.5 text-sm"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className={
                  decision === "approved"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    : "bg-destructive hover:bg-destructive/90 text-white gap-2"
                }
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm {decision === "approved" ? "Approval" : "Rejection"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
