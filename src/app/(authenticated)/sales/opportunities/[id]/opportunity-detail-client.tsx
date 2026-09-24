"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  TrendingUp,
  ArrowLeft,
  Building2,
  User,
  Calendar,
  DollarSign,
  Plus,
  CheckCircle2,
  XCircle,
  FileText,
  Wrench,
  Compass,
  FileSpreadsheet,
  MessageSquare,
  Clock,
  Loader2,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency, formatDate } from "@/lib/utils"
import { hasPermission } from "@/lib/permissions"
import { updateOpportunityStage } from "../actions"

interface OpportunityDetailClientProps {
  opportunity: any
  permissions: string[]
}

const pipelineStages = [
  { key: "qualified", label: "Qualified", probability: 10 },
  { key: "technical", label: "Technical", probability: 30 },
  { key: "site_visit", label: "Site Visit", probability: 40 },
  { key: "quotation", label: "Quotation", probability: 60 },
  { key: "negotiation", label: "Negotiation", probability: 80 },
  { key: "awaiting_po", label: "Awaiting PO", probability: 90 },
  { key: "won", label: "Won", probability: 100 },
]

export function OpportunityDetailClient({ opportunity, permissions }: OpportunityDetailClientProps) {
  const router = useRouter()
  const canEdit = hasPermission(permissions, "opportunities.edit")
  const canCreateQuotation = hasPermission(permissions, "quotations.create")

  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(false)
  const [isLostDialogOpen, setIsLostDialogOpen] = useState(false)
  const [lostReason, setLostReason] = useState("")

  const currentStageIndex = pipelineStages.findIndex((s) => s.key === opportunity.stage)
  const isWon = opportunity.stage === "won"
  const isLost = opportunity.stage === "lost"

  const handleStageSelect = async (newStage: string) => {
    if (!canEdit || loading) return
    if (newStage === "lost") {
      setIsLostDialogOpen(true)
      return
    }

    setLoading(true)
    try {
      const res = await updateOpportunityStage(opportunity.id, newStage)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.error)
      }
    } catch (err: any) {
      alert(err.message || "Failed to update stage")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmLost = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await updateOpportunityStage(opportunity.id, "lost", 0, lostReason)
      if (res.success) {
        setIsLostDialogOpen(false)
        router.refresh()
      } else {
        alert(res.error)
      }
    } catch (err: any) {
      alert(err.message || "Failed to mark as lost")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/sales/opportunities">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Opportunities
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-foreground font-semibold">
            {opportunity.businessId}
          </span>
          <Badge
            variant={isWon ? "default" : isLost ? "destructive" : "outline"}
            className={isWon ? "bg-emerald-600 text-white" : "capitalize"}
          >
            {opportunity.stage.replace("_", " ")} ({opportunity.probability}%)
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canCreateQuotation && !isLost && (
            <Link href={`/commercial/quotations/new?opportunityId=${opportunity.id}&companyId=${opportunity.companyId}`}>
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" />
                Build Quotation
              </Button>
            </Link>
          )}

          {canEdit && !isWon && !isLost && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStageSelect("won")}
                disabled={loading}
                className="gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark Won
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsLostDialogOpen(true)}
                disabled={loading}
                className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <XCircle className="w-4 h-4" />
                Mark Lost
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Deal Summary Card */}
      <Card className="border-border">
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{opportunity.title}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                <Link
                  href={`/customers/companies/${opportunity.company.id}`}
                  className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors"
                >
                  <Building2 className="w-4 h-4 text-primary" />
                  {opportunity.company.name}
                </Link>
                {opportunity.contact && (
                  <span className="inline-flex items-center gap-1.5">
                    <User className="w-4 h-4 text-muted-foreground" />
                    {opportunity.contact.firstName} {opportunity.contact.lastName}
                  </span>
                )}
                {opportunity.expectedCloseDate && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    Target Close: {formatDate(opportunity.expectedCloseDate)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
              <div className="text-right">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Opportunity Value</div>
                <div className="text-2xl font-bold font-mono text-foreground mt-0.5">
                  {formatCurrency(opportunity.estimatedValue)}
                </div>
                <div className="text-xs text-primary font-mono font-medium">
                  Weighted: {formatCurrency((opportunity.estimatedValue * opportunity.probability) / 100)}
                </div>
              </div>
            </div>
          </div>

          {/* Visual Stage Pipeline Stepper */}
          <div className="pt-4 border-t border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Deal Progression Stage
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {pipelineStages.map((stageItem, idx) => {
                const isCurrent = opportunity.stage === stageItem.key
                const isPassed = !isLost && currentStageIndex > idx

                return (
                  <button
                    key={stageItem.key}
                    type="button"
                    disabled={!canEdit || loading}
                    onClick={() => handleStageSelect(stageItem.key)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isCurrent
                        ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                        : isPassed
                        ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span>{stageItem.label}</span>
                      {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-1">
                      {stageItem.probability}% Win prob
                    </div>
                  </button>
                )
              })}
            </div>
            {isLost && (
              <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-sm text-rose-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Deal marked as Lost: {opportunity.lostReason || "No reason specified"}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="technical">
            Technical ({opportunity.technicalRequirements?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="site_visits">
            Site Visits ({opportunity.siteVisits?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="boqs">
            BOQ ({opportunity.boqs?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="quotations">
            Quotations ({opportunity.quotations?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="negotiations">
            Negotiations ({opportunity.negotiations?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="activities">
            Activities ({opportunity.activities?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">Commercial Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Deal Stage:</span>
                  <span className="font-semibold capitalize text-foreground">{opportunity.stage.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Contract Value:</span>
                  <span className="font-mono font-bold text-foreground">{formatCurrency(opportunity.estimatedValue)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Probability:</span>
                  <span className="font-mono font-medium">{opportunity.probability}%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Expected Close:</span>
                  <span>{opportunity.expectedCloseDate ? formatDate(opportunity.expectedCloseDate) : "TBD"}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Sales Rep / Owner:</span>
                  <span className="font-medium">
                    {opportunity.owner ? `${opportunity.owner.firstName} ${opportunity.owner.lastName}` : "Unassigned"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">Originating Inquiry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {opportunity.inquiry ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Link
                        href={`/sales/inquiries/${opportunity.inquiry.id}`}
                        className="font-mono font-semibold text-primary hover:underline"
                      >
                        {opportunity.inquiry.businessId}
                      </Link>
                      <Badge variant="outline" className="text-xs">
                        {opportunity.inquiry.discipline || "Industrial"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground bg-muted/20 p-3 rounded border border-border">
                      {opportunity.inquiry.scope}
                    </p>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic">
                    This opportunity was created directly without a prior inquiry.
                  </div>
                )}
              </CardContent>
            </Card>

            {opportunity.notes && (
              <Card className="border-border md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Strategy & Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">{opportunity.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab: Quotations */}
        <TabsContent value="quotations">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Commercial Quotations</CardTitle>
              {canCreateQuotation && (
                <Link href={`/commercial/quotations/new?opportunityId=${opportunity.id}&companyId=${opportunity.companyId}`}>
                  <Button size="sm" className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    New Quotation
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {opportunity.quotations && opportunity.quotations.length > 0 ? (
                <div className="divide-y divide-border">
                  {opportunity.quotations.map((q: any) => (
                    <div key={q.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={`/commercial/quotations/${q.id}`} className="font-mono font-semibold text-primary hover:underline">
                            {q.businessId}
                          </Link>
                          <Badge variant="outline" className="capitalize text-xs font-normal">
                            {q.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Created {formatDate(q.createdAt)} {q.validUntil ? `• Valid until ${formatDate(q.validUntil)}` : ""}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-sm text-foreground">
                          {formatCurrency(q.total || 0, q.currency)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          v{q.versions?.[0]?.versionNum || 1}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No quotations prepared yet for this deal.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Technical */}
        <TabsContent value="technical">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Technical Specifications & Requirements</CardTitle>
              <Link href={`/technical/requirements/new?opportunityId=${opportunity.id}`}>
                <Button size="sm" className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Add Specification
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {opportunity.technicalRequirements && opportunity.technicalRequirements.length > 0 ? (
                <div className="space-y-3">
                  {opportunity.technicalRequirements.map((tr: any) => (
                    <div key={tr.id} className="p-3 rounded-lg border border-border bg-card">
                      <div className="font-semibold text-sm">{tr.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 capitalize">Discipline: {tr.discipline}</div>
                      {tr.scope && <p className="text-xs text-muted-foreground mt-1.5">{tr.scope}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No technical requirements filed yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Site Visits */}
        <TabsContent value="site_visits">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Site Surveys & Inspections</CardTitle>
              <Link href={`/technical/site-visits/new?opportunityId=${opportunity.id}`}>
                <Button size="sm" className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Schedule Visit
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {opportunity.siteVisits && opportunity.siteVisits.length > 0 ? (
                <div className="space-y-3">
                  {opportunity.siteVisits.map((sv: any) => (
                    <div key={sv.id} className="p-3 rounded-lg border border-border bg-card flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-sm">{sv.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Date: {formatDate(sv.visitDate)} • Location: {sv.location}
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize text-xs font-normal">
                        {sv.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No site visits scheduled for this deal.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: BOQ */}
        <TabsContent value="boqs">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Bill of Quantities (BOQ)</CardTitle>
              <Link href={`/technical/boq/new?opportunityId=${opportunity.id}`}>
                <Button size="sm" className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Create BOQ
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {opportunity.boqs && opportunity.boqs.length > 0 ? (
                <div className="space-y-3">
                  {opportunity.boqs.map((boq: any) => (
                    <div key={boq.id} className="p-3 rounded-lg border border-border bg-card flex justify-between items-center">
                      <div>
                        <div className="font-mono text-xs font-bold text-primary">{boq.businessId}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {boq.title} • {boq.items?.length || 0} line items
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize text-xs font-normal">
                        {boq.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No BOQ generated yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Negotiations */}
        <TabsContent value="negotiations">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Negotiation Rounds</CardTitle>
            </CardHeader>
            <CardContent>
              {opportunity.negotiations && opportunity.negotiations.length > 0 ? (
                <div className="space-y-3">
                  {opportunity.negotiations.map((neg: any) => (
                    <div key={neg.id} className="p-3 rounded-lg border border-border bg-card">
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span>Round {neg.roundNum}</span>
                        <span className="font-mono">{formatCurrency(neg.offeredAmount)}</span>
                      </div>
                      {neg.notes && <p className="text-xs text-muted-foreground mt-1">{neg.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No negotiation rounds recorded.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Activities */}
        <TabsContent value="activities">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              {opportunity.activities && opportunity.activities.length > 0 ? (
                <div className="space-y-3">
                  {opportunity.activities.map((act: any) => (
                    <div key={act.id} className="p-3 rounded-lg border border-border bg-card">
                      <div className="flex items-center gap-2 text-sm font-semibold capitalize">
                        <span>{act.type}:</span>
                        <span>{act.subject}</span>
                      </div>
                      {act.description && <p className="text-xs text-muted-foreground mt-1">{act.description}</p>}
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {formatDate(act.createdAt)} by {act.user?.firstName} {act.user?.lastName}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No activities recorded yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mark as Lost Dialog */}
      <Dialog open={isLostDialogOpen} onOpenChange={setIsLostDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Opportunity as Lost</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConfirmLost} className="space-y-4 mt-2">
            <p className="text-xs text-muted-foreground">
              Please specify the primary reason why this deal was lost. This data is critical for loss analysis and pricing optimization.
            </p>
            <div className="space-y-2">
              <Label htmlFor="lostReason">Loss Reason / Competitor Info</Label>
              <Textarea
                id="lostReason"
                rows={3}
                required
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                placeholder="e.g. Lost on price to ABB (15% lower), client delayed project to 2027, etc."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsLostDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm Lost
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
