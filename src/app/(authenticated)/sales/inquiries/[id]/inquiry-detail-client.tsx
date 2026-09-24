"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  FileQuestion,
  ArrowLeft,
  Building2,
  User,
  MapPin,
  Calendar,
  CheckCircle2,
  TrendingUp,
  XCircle,
  AlertTriangle,
  Loader2,
  Edit3,
  Clock,
  Send,
  DollarSign,
  Tag,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency, formatDate } from "@/lib/utils"
import { hasPermission } from "@/lib/permissions"
import { qualifyInquiry, convertToOpportunity, updateInquiryStatus, updateInquiry } from "../actions"

interface InquiryDetailClientProps {
  inquiry: any
  permissions: string[]
}

const statusBadgeStyles: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  in_review: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  qualified: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  converted: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  lost: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  closed: "bg-gray-500/10 text-gray-600 border-gray-500/20",
}

export function InquiryDetailClient({ inquiry, permissions }: InquiryDetailClientProps) {
  const router = useRouter()
  const canQualify = hasPermission(permissions, "inquiries.qualify")
  const canConvert = hasPermission(permissions, "opportunities.create")
  const canEdit = hasPermission(permissions, "inquiries.edit")

  const [isQualifyOpen, setIsQualifyOpen] = useState(false)
  const [isConvertOpen, setIsConvertOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Qualification form state
  const [qualifyForm, setQualifyForm] = useState({
    customerNeed: inquiry.customerNeed || "",
    budget: inquiry.budget || "",
    timeline: inquiry.timeline || "",
    decisionMaker: inquiry.decisionMaker || (inquiry.contact ? `${inquiry.contact.firstName} ${inquiry.contact.lastName}` : ""),
    currentVendor: inquiry.currentVendor || "",
    competitor: inquiry.competitor || "",
    urgency: inquiry.urgency || inquiry.priority || "medium",
    technicalReq: inquiry.technicalReq || "",
    estimatedValue: inquiry.estimatedValue || 0,
  })

  // Edit Inquiry state
  const [isEditInquiryOpen, setIsEditInquiryOpen] = useState(false)
  const [editInquiryForm, setEditInquiryForm] = useState({
    scope: inquiry.scope || "",
    discipline: inquiry.discipline || "Electrical & Instrumentation",
    location: inquiry.location || "",
    estimatedValue: inquiry.estimatedValue || 0,
    priority: (inquiry.priority || "medium") as "low" | "medium" | "high" | "urgent",
    status: inquiry.status || "new",
  })

  const handleUpdateInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await updateInquiry(inquiry.id, {
        ...editInquiryForm,
        estimatedValue: Number(editInquiryForm.estimatedValue) || 0,
      })
      if (res.success) {
        setIsEditInquiryOpen(false)
        router.refresh()
      } else {
        setError(res.error)
      }
    } catch (err: any) {
      setError(err.message || "Failed to update inquiry")
    } finally {
      setLoading(false)
    }
  }


  // Convert to Opportunity form state
  const [convertForm, setConvertForm] = useState({
    title: `${inquiry.discipline || "Project"} - ${inquiry.company.name}`,
    estimatedValue: inquiry.estimatedValue || 0,
  })

  const handleQualify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await qualifyInquiry(inquiry.id, {
        ...qualifyForm,
        estimatedValue: Number(qualifyForm.estimatedValue) || undefined,
      })
      if (res.success) {
        setIsQualifyOpen(false)
        router.refresh()
      } else {
        setError(res.error)
      }
    } catch (err: any) {
      setError(err.message || "Failed to qualify inquiry")
    } finally {
      setLoading(false)
    }
  }

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await convertToOpportunity(
        inquiry.id,
        convertForm.title,
        Number(convertForm.estimatedValue) || undefined
      )
      if (res.success) {
        setIsConvertOpen(false)
        router.push(`/sales/opportunities/${res.data.opportunityId}`)
      } else {
        setError(res.error)
      }
    } catch (err: any) {
      setError(err.message || "Failed to convert inquiry to opportunity")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    try {
      const res = await updateInquiryStatus(inquiry.id, newStatus)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.error)
      }
    } catch (err: any) {
      alert(err.message || "Failed to update status")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/sales/inquiries">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Inquiries
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-foreground font-semibold">
            {inquiry.businessId}
          </span>
          <div className="flex items-center gap-1.5 bg-muted/40 px-2 py-1 rounded-md border border-border">
            <span className="text-xs text-muted-foreground font-medium">Status:</span>
            <select
              value={inquiry.status}
              disabled={!canEdit || loading}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-2 py-0.5 text-xs font-semibold rounded border border-input bg-background cursor-pointer text-foreground focus:ring-1 focus:ring-primary"
            >
              <option value="new">New</option>
              <option value="in_review">In Review</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => setIsEditInquiryOpen(true)} className="gap-1.5">
              <Edit3 className="w-4 h-4" />
              Edit Details
            </Button>
          )}

          {inquiry.opportunity ? (
            <Link href={`/sales/opportunities/${inquiry.opportunity.id}`}>
              <Button size="sm" variant="outline" className="gap-1.5 text-purple-600 border-purple-500/30">
                <TrendingUp className="w-4 h-4" />
                View Opportunity ({inquiry.opportunity.businessId})
              </Button>
            </Link>
          ) : (
            <>
              {canQualify && inquiry.status !== "converted" && (
                <Button size="sm" variant="outline" onClick={() => setIsQualifyOpen(true)} className="gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  {inquiry.status === "qualified" ? "Edit Qualification" : "Qualify Inquiry"}
                </Button>
              )}
              {canConvert && inquiry.status !== "converted" && (
                <Button size="sm" onClick={() => setIsConvertOpen(true)} className="gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  Convert to Opportunity
                </Button>
              )}
            </>
          )}

          {canEdit && inquiry.status !== "converted" && inquiry.status !== "closed" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStatusChange("closed")}
              className="text-muted-foreground hover:text-destructive text-xs"
            >
              Close Inquiry
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Technical Scope & Qualification */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scope Card */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Inquiry Scope & Requirements</CardTitle>
                <Badge variant="outline" className="capitalize text-xs font-normal">
                  {inquiry.priority} priority
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Discipline
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {inquiry.discipline || "General Industrial EPC"}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Requirements Description
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-lg border border-border">
                  {inquiry.scope}
                </p>
              </div>

              {inquiry.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Site: {inquiry.location}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Qualification Card */}
          <Card className="border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">BANT & Technical Qualification</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Budget, Authority, Need, Timeline, and technical readiness
                </p>
              </div>
              {canQualify && (
                <Button size="sm" variant="ghost" onClick={() => setIsQualifyOpen(true)} className="gap-1 text-xs">
                  <Edit3 className="w-3.5 h-3.5" />
                  Update
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {inquiry.status === "qualified" || inquiry.customerNeed || inquiry.budget ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-muted/20 rounded-lg border border-border">
                    <div className="text-xs text-muted-foreground font-medium">Customer Need</div>
                    <div className="font-medium mt-1">{inquiry.customerNeed || "—"}</div>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-lg border border-border">
                    <div className="text-xs text-muted-foreground font-medium">Budget Confirmed</div>
                    <div className="font-medium mt-1">{inquiry.budget || "—"}</div>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-lg border border-border">
                    <div className="text-xs text-muted-foreground font-medium">Project Timeline</div>
                    <div className="font-medium mt-1">{inquiry.timeline || "—"}</div>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-lg border border-border">
                    <div className="text-xs text-muted-foreground font-medium">Decision Maker</div>
                    <div className="font-medium mt-1">{inquiry.decisionMaker || "—"}</div>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-lg border border-border">
                    <div className="text-xs text-muted-foreground font-medium">Current Vendor</div>
                    <div className="font-medium mt-1">{inquiry.currentVendor || "—"}</div>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-lg border border-border">
                    <div className="text-xs text-muted-foreground font-medium">Competitors</div>
                    <div className="font-medium mt-1">{inquiry.competitor || "—"}</div>
                  </div>
                  <div className="sm:col-span-2 p-3 bg-muted/20 rounded-lg border border-border">
                    <div className="text-xs text-muted-foreground font-medium">Technical Prerequisites</div>
                    <div className="font-medium mt-1">{inquiry.technicalReq || "Standard specs applied."}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed rounded-lg border-border">
                  <ShieldCheck className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-50" />
                  <p className="text-sm font-medium text-foreground">Inquiry Not Yet Qualified</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Evaluate customer budget, timeline, decision authority, and technical constraints before moving into quotation.
                  </p>
                  {canQualify && (
                    <Button size="sm" onClick={() => setIsQualifyOpen(true)} className="mt-4 gap-1.5">
                      Qualify Now
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Client, Ownership & Metadata */}
        <div className="space-y-6">
          {/* Client Info Card */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Client Company</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <Link
                  href={`/customers/companies/${inquiry.company.id}`}
                  className="font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {inquiry.company.name}
                </Link>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {inquiry.company.businessId}
              </div>
              {inquiry.contact && (
                <div className="pt-2 border-t border-border">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Contact Person
                  </div>
                  <div className="font-medium">
                    {inquiry.contact.firstName} {inquiry.contact.lastName}
                  </div>
                  {inquiry.contact.designation && (
                    <div className="text-xs text-muted-foreground">{inquiry.contact.designation}</div>
                  )}
                  {inquiry.contact.email && (
                    <a
                      href={`mailto:${inquiry.contact.email}`}
                      className="text-xs text-primary hover:underline block mt-1"
                    >
                      {inquiry.contact.email}
                    </a>
                  )}
                  {inquiry.contact.phone && (
                    <div className="text-xs text-muted-foreground mt-0.5">{inquiry.contact.phone}</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Commercial & Team */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Commercial & Ownership</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">Estimated Value:</span>
                <span className="font-mono text-base font-bold text-foreground">
                  {inquiry.estimatedValue ? formatCurrency(inquiry.estimatedValue) : "Not Specified"}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Lead Source:</span>
                <span className="capitalize font-medium text-foreground">
                  {inquiry.source.replace("_", " ")}
                </span>
              </div>
              <div className="pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground block">Sales Lead:</span>
                <span className="font-medium text-foreground">
                  {inquiry.salesperson
                    ? `${inquiry.salesperson.firstName} ${inquiry.salesperson.lastName}`
                    : "Unassigned"}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Technical Owner:</span>
                <span className="font-medium text-foreground">
                  {inquiry.technicalOwner
                    ? `${inquiry.technicalOwner.firstName} ${inquiry.technicalOwner.lastName}`
                    : "Unassigned"}
                </span>
              </div>
              <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                Received on {formatDate(inquiry.createdAt)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Qualify Dialog */}
      <Dialog open={isQualifyOpen} onOpenChange={setIsQualifyOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Qualify Inquiry ({inquiry.businessId})</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQualify} className="space-y-4 mt-2">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="qNeed">Customer Need / Core Problem</Label>
                <Input
                  id="qNeed"
                  value={qualifyForm.customerNeed}
                  onChange={(e) => setQualifyForm({ ...qualifyForm, customerNeed: e.target.value })}
                  placeholder="e.g. Replacing aging switchgear and PLC automation"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="qBudget">Budget Confirmation</Label>
                <Input
                  id="qBudget"
                  value={qualifyForm.budget}
                  onChange={(e) => setQualifyForm({ ...qualifyForm, budget: e.target.value })}
                  placeholder="e.g. Approved CapEx ~ 200,000 AED"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="qValue">Estimated Value (AED)</Label>
                <Input
                  id="qValue"
                  type="number"
                  min="0"
                  step="1000"
                  value={qualifyForm.estimatedValue}
                  onChange={(e) => setQualifyForm({ ...qualifyForm, estimatedValue: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="qTimeline">Timeline</Label>
                <Input
                  id="qTimeline"
                  value={qualifyForm.timeline}
                  onChange={(e) => setQualifyForm({ ...qualifyForm, timeline: e.target.value })}
                  placeholder="e.g. Q4 Turnaround (Oct 2026)"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="qDecisionMaker">Decision Maker</Label>
                <Input
                  id="qDecisionMaker"
                  value={qualifyForm.decisionMaker}
                  onChange={(e) => setQualifyForm({ ...qualifyForm, decisionMaker: e.target.value })}
                  placeholder="e.g. Technical Director & VP Finance"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="qVendor">Current Vendor / Incumbent</Label>
                <Input
                  id="qVendor"
                  value={qualifyForm.currentVendor}
                  onChange={(e) => setQualifyForm({ ...qualifyForm, currentVendor: e.target.value })}
                  placeholder="e.g. Siemens Services"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="qCompetitor">Competing Bidders</Label>
                <Input
                  id="qCompetitor"
                  value={qualifyForm.competitor}
                  onChange={(e) => setQualifyForm({ ...qualifyForm, competitor: e.target.value })}
                  placeholder="e.g. ABB, Local EPC contractor"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="qTech">Technical Constraints / Prerequisites</Label>
                <Textarea
                  id="qTech"
                  rows={3}
                  value={qualifyForm.technicalReq}
                  onChange={(e) => setQualifyForm({ ...qualifyForm, technicalReq: e.target.value })}
                  placeholder="Specific vendor makes, certifications, ATEX zone requirements, shutdown window..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsQualifyOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Qualification
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Convert to Opportunity Dialog */}
      <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Convert Inquiry to Deal Pipeline</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConvert} className="space-y-4 mt-2">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              This will create a new Opportunity record in the sales pipeline and link this inquiry directly to it.
            </p>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="oppTitle">Opportunity Title *</Label>
                <Input
                  id="oppTitle"
                  value={convertForm.title}
                  onChange={(e) => setConvertForm({ ...convertForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="oppValue">Deal Value (AED) *</Label>
                <Input
                  id="oppValue"
                  type="number"
                  min="0"
                  step="1000"
                  value={convertForm.estimatedValue}
                  onChange={(e) => setConvertForm({ ...convertForm, estimatedValue: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsConvertOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-1.5">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <TrendingUp className="w-4 h-4" />
                Create Opportunity
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Inquiry Dialog */}
      <Dialog open={isEditInquiryOpen} onOpenChange={setIsEditInquiryOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Inquiry / Lead Details</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateInquirySubmit} className="space-y-4 mt-2">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="editStatus">Status</Label>
                <select
                  id="editStatus"
                  value={editInquiryForm.status}
                  onChange={(e) => setEditInquiryForm({ ...editInquiryForm, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground"
                >
                  <option value="new">New</option>
                  <option value="in_review">In Review</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="editPriority">Priority</Label>
                <select
                  id="editPriority"
                  value={editInquiryForm.priority}
                  onChange={(e) => setEditInquiryForm({ ...editInquiryForm, priority: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="editDiscipline">Discipline</Label>
                <Input
                  id="editDiscipline"
                  value={editInquiryForm.discipline}
                  onChange={(e) => setEditInquiryForm({ ...editInquiryForm, discipline: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="editVal">Estimated Value (AED)</Label>
                <Input
                  id="editVal"
                  type="number"
                  min="0"
                  step="1000"
                  value={editInquiryForm.estimatedValue}
                  onChange={(e) => setEditInquiryForm({ ...editInquiryForm, estimatedValue: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="col-span-2 space-y-1">
                <Label htmlFor="editLocation">Site Location</Label>
                <Input
                  id="editLocation"
                  value={editInquiryForm.location}
                  onChange={(e) => setEditInquiryForm({ ...editInquiryForm, location: e.target.value })}
                  placeholder="e.g. Dubai Industrial City"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <Label htmlFor="editScope">Scope Description *</Label>
                <Textarea
                  id="editScope"
                  rows={4}
                  required
                  value={editInquiryForm.scope}
                  onChange={(e) => setEditInquiryForm({ ...editInquiryForm, scope: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditInquiryOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
