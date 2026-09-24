"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  MapPin,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  Building2,
  TrendingUp,
  Loader2,
  AlertTriangle,
  User,
  Wrench,
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
import { formatDate } from "@/lib/utils"
import { hasPermission } from "@/lib/permissions"
import { createSiteVisit, updateSiteVisitStatus } from "../actions"

interface SiteVisitItem {
  id: string
  purpose: string
  visitDate: string
  location: string
  status: string
  company: { id: string; name: string }
  opportunity: { id: string; businessId: string; title: string; company: { id: string; name: string } } | null
  engineers: string
  outcome: string | null
  nextAction: string | null
  createdAt: string
}

interface SiteVisitsClientProps {
  visits: SiteVisitItem[]
  options: {
    opportunities: { id: string; businessId: string; title: string; company: { id: string; name: string } }[]
    users: { id: string; firstName: string; lastName: string }[]
    companies: { id: string; name: string; businessId: string }[]
  }
  search: string
  status: string
  permissions: string[]
}

const statusBadgeStyles: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-600 border-rose-500/20",
}

export function SiteVisitsClient({
  visits,
  options,
  search: initialSearch,
  status: initialStatus,
  permissions,
}: SiteVisitsClientProps) {
  const router = useRouter()
  const canEdit = hasPermission(permissions, "technical.edit")

  const [search, setSearch] = useState(initialSearch)
  const [status, setStatus] = useState(initialStatus)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Status modal state
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState<SiteVisitItem | null>(null)
  const [statusForm, setStatusForm] = useState({
    status: "completed",
    outcome: "",
    nextAction: "",
  })

  // Create form
  const [form, setForm] = useState({
    opportunityId: "",
    companyId: "",
    purpose: "",
    visitDate: new Date().toISOString().split("T")[0],
    location: "",
    nextAction: "",
    engineerIds: [] as string[],
  })

  const handleFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const p = new URLSearchParams()
    if (search) p.set("search", search)
    if (status !== "all") p.set("status", status)
    router.push(`/technical/site-visits?${p.toString()}`)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await createSiteVisit({
        opportunityId: form.opportunityId || undefined,
        companyId: form.companyId || undefined,
        purpose: form.purpose,
        visitDate: form.visitDate,
        location: form.location,
        nextAction: form.nextAction || undefined,
        engineerIds: form.engineerIds.length ? form.engineerIds : undefined,
      })
      if (res.success) {
        setIsDialogOpen(false)
        setForm({
          opportunityId: "",
          companyId: "",
          purpose: "",
          visitDate: new Date().toISOString().split("T")[0],
          location: "",
          nextAction: "",
          engineerIds: [],
        })
        router.refresh()
      } else {
        setError("Failed to schedule site visit")
      }
    } catch (err: any) {
      setError(err.message || "Failed to schedule site visit")
    } finally {
      setLoading(false)
    }
  }

  const openStatusDialog = (visit: SiteVisitItem) => {
    setSelectedVisit(visit)
    setStatusForm({
      status: visit.status === "scheduled" ? "completed" : visit.status,
      outcome: visit.outcome || "",
      nextAction: visit.nextAction || "",
    })
    setIsStatusDialogOpen(true)
  }

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVisit) return
    setLoading(true)
    try {
      await updateSiteVisitStatus(
        selectedVisit.id,
        statusForm.status,
        statusForm.outcome,
        statusForm.nextAction
      )
      setIsStatusDialogOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
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
            <MapPin className="w-6 h-6 text-primary" />
            Site Visits & Audits
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Coordinate engineering site surveys, field inspections, and technical audits
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Schedule Site Visit
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by purpose, location, company, or opportunity..."
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
              router.push(`/technical/site-visits?${p.toString()}`)
            }}
            className="px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>
      </div>

      {/* Visits Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Purpose & Opportunity</th>
                <th>Company & Location</th>
                <th>Visit Date</th>
                <th>Assigned Engineers</th>
                <th>Status</th>
                <th>Outcome / Findings</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {visits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No site visits found matching your filters.
                  </td>
                </tr>
              ) : (
                visits.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/40 transition-colors">
                    <td>
                      <div className="font-semibold text-foreground text-sm">{v.purpose}</div>
                      {v.opportunity && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-primary font-mono">
                          <TrendingUp className="w-3 h-3" />
                          <Link href={`/sales/opportunities/${v.opportunity.id}`} className="hover:underline">
                            {v.opportunity.businessId}: {v.opportunity.title}
                          </Link>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="font-medium text-foreground text-sm flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        {v.company.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {v.location}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {formatDate(v.visitDate)}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3 text-muted-foreground" />
                        {v.engineers || "Unassigned"}
                      </div>
                    </td>
                    <td>
                      <Badge
                        variant="outline"
                        className={`capitalize text-xs font-medium ${statusBadgeStyles[v.status] || ""}`}
                      >
                        {v.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="text-xs text-muted-foreground max-w-[200px] line-clamp-2">
                        {v.outcome || "Pending site execution"}
                      </div>
                    </td>
                    <td className="text-right">
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => openStatusDialog(v)}
                        >
                          Update Status
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Schedule Engineering Site Visit
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label className="text-xs">Opportunity (Optional)</Label>
              <select
                value={form.opportunityId}
                onChange={(e) => {
                  const oppId = e.target.value
                  const opp = options.opportunities.find((o) => o.id === oppId)
                  setForm({
                    ...form,
                    opportunityId: oppId,
                    companyId: opp ? opp.company.id : form.companyId,
                  })
                }}
                className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select Opportunity...</option>
                {options.opportunities.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    {opp.businessId} — {opp.title} ({opp.company.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs">Client Company</Label>
              <select
                value={form.companyId}
                onChange={(e) => setForm({ ...form, companyId: e.target.value })}
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
              <Label className="text-xs">Visit Purpose</Label>
              <Input
                placeholder="e.g. PLC Panel Inspection & Cable Routing Audit"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                className="mt-1.5"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Visit Date</Label>
                <Input
                  type="date"
                  value={form.visitDate}
                  onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Location / Facility</Label>
                <Input
                  placeholder="e.g. Jebel Ali Port Berth 4"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="mt-1.5"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Assign Lead Engineers</Label>
              <div className="mt-1.5 max-h-32 overflow-y-auto border border-input rounded-md p-2 space-y-1">
                {options.users.map((u) => {
                  const checked = form.engineerIds.includes(u.id)
                  return (
                    <label key={u.id} className="flex items-center gap-2 text-xs cursor-pointer p-1 hover:bg-muted rounded">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setForm({
                            ...form,
                            engineerIds: checked
                              ? form.engineerIds.filter((id) => id !== u.id)
                              : [...form.engineerIds, u.id],
                          })
                        }}
                      />
                      <span>{u.firstName} {u.lastName}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div>
              <Label className="text-xs">Next Action Required</Label>
              <Input
                placeholder="e.g. Prepare detailed BOQ and cable schedule"
                value={form.nextAction}
                onChange={(e) => setForm({ ...form, nextAction: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Schedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Status & Findings Modal */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Update Site Visit Outcome
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdateStatus} className="space-y-4">
            <div>
              <Label className="text-xs">Visit Status</Label>
              <select
                value={statusForm.status}
                onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <Label className="text-xs">Findings & Outcome</Label>
              <Textarea
                rows={3}
                placeholder="Record technical findings, site constraints, measurement notes..."
                value={statusForm.outcome}
                onChange={(e) => setStatusForm({ ...statusForm, outcome: e.target.value })}
                className="mt-1.5 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs">Follow-up Action</Label>
              <Input
                placeholder="e.g. Revise sizing calculation, request manufacturer quotes"
                value={statusForm.nextAction}
                onChange={(e) => setStatusForm({ ...statusForm, nextAction: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Outcome
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
