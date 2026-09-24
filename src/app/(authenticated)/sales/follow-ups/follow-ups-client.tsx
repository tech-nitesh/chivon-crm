"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BellRing,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  TrendingUp,
  Loader2,
  Calendar,
  Edit3,
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
import { createFollowUp, completeFollowUp, updateFollowUp, updateFollowUpStatus } from "./actions"

interface FollowUpItem {
  id: string
  action: string
  owner: string | null
  company: { id: string; name: string; businessId: string } | null
  contact: string | null
  opportunity: { id: string; businessId: string; title: string } | null
  dueDate: string
  priority: string
  status: string
  notes: string | null
  createdAt: string
}

interface FollowUpsClientProps {
  data: {
    followUps: FollowUpItem[]
    total: number
    page: number
    totalPages: number
  }
  options: {
    companies: { id: string; name: string; businessId: string }[]
    opportunities: { id: string; businessId: string; title: string }[]
  }
  search: string
  status: string
  permissions: string[]
}

export function FollowUpsClient({
  data,
  options,
  search: initialSearch,
  status: initialStatus,
  permissions,
}: FollowUpsClientProps) {
  const router = useRouter()
  const canEdit = hasPermission(permissions, "customers.edit")

  const [search, setSearch] = useState(initialSearch)
  const [status, setStatus] = useState(initialStatus)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    action: "",
    companyId: "",
    opportunityId: "",
    dueDate: new Date().toISOString().split("T")[0],
    priority: "medium" as any,
    notes: "",
  })

  const now = new Date()
  const pendingCount = data.followUps.filter((f) => f.status === "pending").length
  const overdueCount = data.followUps.filter(
    (f) => f.status === "pending" && new Date(f.dueDate) < now
  ).length
  const completedCount = data.followUps.filter((f) => f.status === "completed").length

  const handleFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const p = new URLSearchParams()
    if (search) p.set("search", search)
    if (status !== "all") p.set("status", status)
    router.push(`/sales/follow-ups?${p.toString()}`)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await createFollowUp({
        ...form,
        companyId: form.companyId || undefined,
        opportunityId: form.opportunityId || undefined,
        notes: form.notes || undefined,
      })
      if (res.success) {
        setIsDialogOpen(false)
        setForm({
          action: "",
          companyId: "",
          opportunityId: "",
          dueDate: new Date().toISOString().split("T")[0],
          priority: "medium",
          notes: "",
        })
        router.refresh()
      } else {
        setError(res.error || "Failed to schedule follow-up")
      }
    } catch (err: any) {
      setError(err.message || "Failed to schedule follow-up")
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (id: string) => {
    try {
      await completeFollowUp(id)
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<FollowUpItem | null>(null)
  const [editForm, setEditForm] = useState({
    action: "",
    dueDate: "",
    priority: "medium",
    status: "pending",
    notes: "",
  })

  const openEditDialog = (item: FollowUpItem) => {
    setEditingItem(item)
    setEditForm({
      action: item.action,
      dueDate: item.dueDate.split("T")[0],
      priority: item.priority,
      status: item.status,
      notes: item.notes || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    setLoading(true)
    setError(null)
    try {
      const res = await updateFollowUp(editingItem.id, editForm)
      if (res.success) {
        setIsEditDialogOpen(false)
        router.refresh()
      } else {
        setError(res.error || "Failed to update follow-up")
      }
    } catch (err: any) {
      setError(err.message || "Failed to update follow-up")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateFollowUpStatus(id, newStatus)
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BellRing className="w-6 h-6 text-primary" />
            Follow-up Queue & Reminders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track scheduled client touches, quotation follow-ups, and negotiation milestones
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Schedule Follow-up
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Pending Tasks
          </div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {pendingCount}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Overdue Follow-ups
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
            {overdueCount}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Completed Touches
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {completedCount}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search follow-ups by action or company name..."
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
              router.push(`/sales/follow-ups?${p.toString()}`)
            }}
            className="px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Follow-ups</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </form>
      </div>

      {/* Follow-ups List */}
      <div className="card divide-y divide-border overflow-hidden">
        {data.followUps.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BellRing className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No follow-ups found in queue.
          </div>
        ) : (
          data.followUps.map((item) => {
            const isCompleted = item.status === "completed"
            const isOverdue = !isCompleted && new Date(item.dueDate) < now

            return (
              <div key={item.id} className="p-4 hover:bg-muted/30 transition-colors flex items-start gap-4">
                <button
                  type="button"
                  disabled={isCompleted || !canEdit}
                  onClick={() => handleComplete(item.id)}
                  className={`mt-0.5 w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                    isCompleted
                      ? "bg-emerald-600 border-emerald-600 text-white cursor-default"
                      : "border-input hover:border-primary hover:bg-primary/5 cursor-pointer text-transparent hover:text-muted-foreground"
                  }`}
                  title={isCompleted ? "Completed" : "Click to mark complete"}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-semibold text-sm ${
                        isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {item.action}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${
                        isOverdue
                          ? "bg-rose-500/10 text-rose-600 border-rose-500/20 font-semibold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {isOverdue ? "Overdue" : item.priority}
                    </Badge>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                    {item.company && (
                      <Link
                        href={`/customers/companies/${item.company.id}`}
                        className="hover:text-primary transition-colors flex items-center gap-1 font-medium text-foreground"
                      >
                        <Building2 className="w-3 h-3 text-muted-foreground" />
                        {item.company.name}
                      </Link>
                    )}
                    {item.opportunity && (
                      <Link
                        href={`/sales/opportunities/${item.opportunity.id}`}
                        className="hover:text-primary transition-colors flex items-center gap-1 text-purple-600"
                      >
                        <TrendingUp className="w-3 h-3" />
                        {item.opportunity.businessId}
                      </Link>
                    )}
                    <span>• Due: {formatDate(item.dueDate)}</span>
                    {item.owner && <span>• Assigned: {item.owner}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={item.status}
                    disabled={!canEdit}
                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    className="px-2 py-1 text-xs font-semibold rounded border border-input bg-background text-foreground cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(item)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      title="Edit Follow-up"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Schedule Follow-up Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Client Follow-up</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="action">Action Item / Follow-up Purpose *</Label>
              <Input
                id="action"
                value={form.action}
                onChange={(e) => setForm({ ...form, action: e.target.value })}
                placeholder="e.g. Call Procurement Manager to verify quotation receipt"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="fCompany">Associated Company</Label>
              <select
                id="fCompany"
                value={form.companyId}
                onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select Company (optional)</option>
                {options.companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.businessId})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="fOpp">Linked Deal Opportunity</Label>
              <select
                id="fOpp"
                value={form.opportunityId}
                onChange={(e) => setForm({ ...form, opportunityId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select Deal (optional)</option>
                {options.opportunities.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.businessId} - {o.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="fDueDate">Due Date *</Label>
                <Input
                  id="fDueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="fPriority">Priority</Label>
                <select
                  id="fPriority"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="fNotes">Preparation Notes</Label>
              <Textarea
                id="fNotes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Points to discuss, payment milestones to check, specific objections to handle..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Reminder
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Follow-up Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Follow-up Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="editAction">Action / Task Title *</Label>
              <Input
                id="editAction"
                value={editForm.action}
                onChange={(e) => setEditForm({ ...editForm, action: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="editDueDate">Due Date *</Label>
                <Input
                  id="editDueDate"
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="editStatus">Status</Label>
                <select
                  id="editStatus"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="editPriority">Priority</Label>
              <select
                id="editPriority"
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as any })}
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="editNotes">Notes</Label>
              <Textarea
                id="editNotes"
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
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
