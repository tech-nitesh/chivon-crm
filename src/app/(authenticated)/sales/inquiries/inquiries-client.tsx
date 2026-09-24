"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  FileQuestion,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Building2,
  User,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
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
import { updateInquiryStatus, updateInquiry } from "./actions"
import { Edit3, Loader2 } from "lucide-react"

interface InquiryItem {
  id: string
  businessId: string
  company: {
    id: string
    name: string
    businessId: string
  }
  contact: {
    id: string
    name: string
    email: string | null
    phone: string | null
  } | null
  serviceName: string | null
  discipline: string | null
  scope: string | null
  location: string | null
  estimatedValue: number | null
  priority: string
  source: string
  status: string
  salesperson: string | null
  opportunity: {
    id: string
    businessId: string
    stage: string
  } | null
  createdAt: string
}

interface InquiriesClientProps {
  data: {
    inquiries: InquiryItem[]
    total: number
    page: number
    totalPages: number
  }
  search: string
  status: string
  priority: string
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

const priorityBadgeStyles: Record<string, string> = {
  urgent: "bg-red-500/10 text-red-600 border-red-500/20 font-semibold",
  high: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  medium: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  low: "bg-gray-500/10 text-gray-500 border-gray-500/20",
}

export function InquiriesClient({
  data,
  search: initialSearch,
  status: initialStatus,
  priority: initialPriority,
  permissions,
}: InquiriesClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [status, setStatus] = useState(initialStatus)
  const [priority, setPriority] = useState(initialPriority)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Edit Inquiry Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingInquiry, setEditingInquiry] = useState<InquiryItem | null>(null)
  const [editForm, setEditForm] = useState({
    status: "new",
    priority: "medium",
    estimatedValue: 0,
    scope: "",
    discipline: "",
    location: "",
  })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const canCreate = hasPermission(permissions, "inquiries.create")
  const canEdit = hasPermission(permissions, "inquiries.edit")

  const handleStatusChange = async (inqId: string, newStatus: string) => {
    try {
      setLoadingId(inqId)
      await updateInquiryStatus(inqId, newStatus)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingId(null)
    }
  }

  const openEditModal = (inq: InquiryItem) => {
    setEditingInquiry(inq)
    setEditForm({
      status: inq.status,
      priority: inq.priority,
      estimatedValue: inq.estimatedValue || 0,
      scope: inq.scope || "",
      discipline: inq.discipline || "",
      location: inq.location || "",
    })
    setEditError(null)
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingInquiry) return
    setEditLoading(true)
    setEditError(null)
    try {
      const res = await updateInquiry(editingInquiry.id, {
        status: editForm.status,
        priority: editForm.priority as any,
        estimatedValue: Number(editForm.estimatedValue) || 0,
        scope: editForm.scope,
        discipline: editForm.discipline || undefined,
        location: editForm.location || undefined,
      })
      if (res.success) {
        setIsEditOpen(false)
        router.refresh()
      } else {
        setEditError(res.error || "Failed to update inquiry")
      }
    } catch (err: any) {
      setEditError(err.message || "Failed to update inquiry")
    } finally {
      setEditLoading(false)
    }
  }

  const handleFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const p = new URLSearchParams()
    if (search) p.set("search", search)
    if (status && status !== "all") p.set("status", status)
    if (priority && priority !== "all") p.set("priority", priority)
    router.push(`/sales/inquiries?${p.toString()}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileQuestion className="w-6 h-6 text-primary" />
            Inquiries & Tender RFPs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Capture, qualify, and route engineering inquiries and tender leads
          </p>
        </div>
        {canCreate && (
          <Link href="/sales/inquiries/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Inquiry
            </Button>
          </Link>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, scope, discipline, company, or contact..."
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
              if (priority !== "all") p.set("priority", priority)
              router.push(`/sales/inquiries?${p.toString()}`)
            }}
            className="px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="in_review">In Review</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value)
              const p = new URLSearchParams()
              if (search) p.set("search", search)
              if (status !== "all") p.set("status", status)
              if (e.target.value !== "all") p.set("priority", e.target.value)
              router.push(`/sales/inquiries?${p.toString()}`)
            }}
            className="px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
          {(search || status !== "all" || priority !== "all") && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearch("")
                setStatus("all")
                setPriority("all")
                router.push("/sales/inquiries")
              }}
            >
              Reset
            </Button>
          )}
        </form>
      </div>

      {/* Inquiries Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Inquiry ID</th>
                <th>Company & Contact</th>
                <th>Discipline & Scope</th>
                <th>Est. Value</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assigned To</th>
                <th>Received</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.inquiries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted-foreground">
                    <FileQuestion className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No inquiries found matching your filters.
                  </td>
                </tr>
              ) : (
                data.inquiries.map((inq) => (
                  <tr key={inq.id} className="hover:bg-muted/40 transition-colors">
                    <td>
                      <Link
                        href={`/sales/inquiries/${inq.id}`}
                        className="font-mono text-xs font-semibold text-primary hover:underline"
                      >
                        {inq.businessId}
                      </Link>
                      <div className="text-[10px] text-muted-foreground capitalize mt-0.5">
                        via {inq.source.replace("_", " ")}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-foreground text-sm flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <Link
                          href={`/customers/companies/${inq.company.id}`}
                          className="hover:text-primary transition-colors"
                        >
                          {inq.company.name}
                        </Link>
                      </div>
                      {inq.contact && (
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {inq.contact.name}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="text-sm font-medium text-foreground">
                        {inq.discipline || inq.serviceName || "General Industrial"}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1 max-w-[240px]">
                        {inq.scope}
                      </div>
                    </td>
                    <td>
                      <div className="font-mono text-sm font-medium">
                        {inq.estimatedValue ? formatCurrency(inq.estimatedValue) : "TBD"}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={inq.status}
                          disabled={!canEdit || loadingId === inq.id}
                          onChange={(e) => handleStatusChange(inq.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-md border border-input focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer capitalize ${statusBadgeStyles[inq.status] || "bg-muted text-foreground"}`}
                        >
                          <option value="new">New</option>
                          <option value="in_review">In Review</option>
                          <option value="qualified">Qualified</option>
                          <option value="converted">Converted</option>
                          <option value="lost">Lost</option>
                          <option value="closed">Closed</option>
                        </select>
                        {loadingId === inq.id && (
                          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      {inq.opportunity && (
                        <div className="mt-1">
                          <Link
                            href={`/sales/opportunities/${inq.opportunity.id}`}
                            className="font-mono text-[10px] text-purple-600 hover:underline flex items-center gap-0.5"
                          >
                            <TrendingUp className="w-3 h-3" />
                            {inq.opportunity.businessId}
                          </Link>
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge
                        variant="outline"
                        className={`capitalize text-[10px] ${priorityBadgeStyles[inq.priority] || ""}`}
                      >
                        {inq.priority}
                      </Badge>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground">
                        {inq.salesperson || "Unassigned"}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground">{formatDate(inq.createdAt)}</span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => openEditModal(inq)}
                            title="Edit Inquiry Details"
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                        )}
                        <Link href={`/sales/inquiries/${inq.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                            View
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Showing page {data.page} of {data.totalPages} ({data.total} total inquiries)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => {
                  const p = new URLSearchParams()
                  if (search) p.set("search", search)
                  if (status !== "all") p.set("status", status)
                  if (priority !== "all") p.set("priority", priority)
                  p.set("page", String(data.page - 1))
                  router.push(`/sales/inquiries?${p.toString()}`)
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= data.totalPages}
                onClick={() => {
                  const p = new URLSearchParams()
                  if (search) p.set("search", search)
                  if (status !== "all") p.set("status", status)
                  if (priority !== "all") p.set("priority", priority)
                  p.set("page", String(data.page + 1))
                  router.push(`/sales/inquiries?${p.toString()}`)
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Inquiry Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" />
              Edit Inquiry ({editingInquiry?.businessId})
            </DialogTitle>
          </DialogHeader>

          {editError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {editError}
            </div>
          )}

          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Status</Label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring capitalize"
                >
                  <option value="new">New</option>
                  <option value="in_review">In Review</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Priority</Label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring capitalize"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Estimated Value (AED)</Label>
              <Input
                type="number"
                value={editForm.estimatedValue}
                onChange={(e) => setEditForm({ ...editForm, estimatedValue: Number(e.target.value) })}
                className="mt-1.5"
                placeholder="e.g. 150000"
              />
            </div>

            <div>
              <Label className="text-xs">Engineering Discipline</Label>
              <Input
                value={editForm.discipline}
                onChange={(e) => setEditForm({ ...editForm, discipline: e.target.value })}
                className="mt-1.5"
                placeholder="e.g. Electrical & Instrumentation"
              />
            </div>

            <div>
              <Label className="text-xs">Site / Plant Location</Label>
              <Input
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                className="mt-1.5"
                placeholder="e.g. Ruwais Industrial Complex"
              />
            </div>

            <div>
              <Label className="text-xs">Scope / Technical Description</Label>
              <Textarea
                rows={3}
                value={editForm.scope}
                onChange={(e) => setEditForm({ ...editForm, scope: e.target.value })}
                className="mt-1.5 text-sm"
                placeholder="Describe project scope, specifications, or deliverables..."
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={editLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editLoading} className="gap-2">
                {editLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
