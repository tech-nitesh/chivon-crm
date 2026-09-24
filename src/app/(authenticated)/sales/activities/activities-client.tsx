"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CalendarClock,
  Plus,
  Search,
  Phone,
  Users,
  Mail,
  MessageSquare,
  FileText,
  Building2,
  TrendingUp,
  CheckCircle2,
  Clock,
  Loader2,
  Check,
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
import { createActivity, updateActivityStatus } from "./actions"

interface ActivityItem {
  id: string
  type: string
  subject: string
  description: string | null
  user: string | null
  company: { id: string; name: string; businessId: string } | null
  contact: string | null
  opportunity: { id: string; businessId: string; title: string } | null
  inquiry: { id: string; businessId: string } | null
  priority: string
  status: string
  dueDate: string | null
  completedAt: string | null
  createdAt: string
}

interface ActivitiesClientProps {
  data: {
    activities: ActivityItem[]
    total: number
    page: number
    totalPages: number
  }
  options: {
    companies: { id: string; name: string; businessId: string }[]
    opportunities: { id: string; businessId: string; title: string }[]
  }
  search: string
  type: string
  status: string
  permissions: string[]
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  meeting: Users,
  email: Mail,
  whatsapp: MessageSquare,
  note: FileText,
}

export function ActivitiesClient({
  data,
  options,
  search: initialSearch,
  type: initialType,
  status: initialStatus,
  permissions,
}: ActivitiesClientProps) {
  const router = useRouter()
  const canEdit = hasPermission(permissions, "customers.edit")

  const [search, setSearch] = useState(initialSearch)
  const [type, setType] = useState(initialType)
  const [status, setStatus] = useState(initialStatus)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    type: "call" as any,
    subject: "",
    description: "",
    companyId: "",
    opportunityId: "",
    dueDate: "",
    priority: "medium" as any,
  })

  const handleFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const p = new URLSearchParams()
    if (search) p.set("search", search)
    if (type !== "all") p.set("type", type)
    if (status !== "all") p.set("status", status)
    router.push(`/sales/activities?${p.toString()}`)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await createActivity({
        ...form,
        companyId: form.companyId || undefined,
        opportunityId: form.opportunityId || undefined,
        dueDate: form.dueDate || undefined,
      })
      if (res.success) {
        setIsDialogOpen(false)
        setForm({
          type: "call",
          subject: "",
          description: "",
          companyId: "",
          opportunityId: "",
          dueDate: "",
          priority: "medium",
        })
        router.refresh()
      } else {
        setError(res.error || "Failed to log activity")
      }
    } catch (err: any) {
      setError(err.message || "Failed to log activity")
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (id: string) => {
    try {
      await updateActivityStatus(id, "completed")
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
            <CalendarClock className="w-6 h-6 text-primary" />
            Client Activity Log
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Maintain complete audit trails of client calls, meetings, notes, and emails
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Log Activity
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search activities by subject, client, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value)
              const p = new URLSearchParams()
              if (search) p.set("search", search)
              if (e.target.value !== "all") p.set("type", e.target.value)
              if (status !== "all") p.set("status", status)
              router.push(`/sales/activities?${p.toString()}`)
            }}
            className="px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Types</option>
            <option value="call">Calls</option>
            <option value="meeting">Meetings</option>
            <option value="email">Emails</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="note">Notes</option>
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              const p = new URLSearchParams()
              if (search) p.set("search", search)
              if (type !== "all") p.set("type", type)
              if (e.target.value !== "all") p.set("status", e.target.value)
              router.push(`/sales/activities?${p.toString()}`)
            }}
            className="px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </form>
      </div>

      {/* Activity Timeline List */}
      <div className="card divide-y divide-border overflow-hidden">
        {data.activities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarClock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No activities found matching criteria.
          </div>
        ) : (
          data.activities.map((item) => {
            const Icon = typeIcons[item.type] || FileText
            const isCompleted = item.status === "completed"

            return (
              <div key={item.id} className="p-4 hover:bg-muted/30 transition-colors flex items-start gap-4">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isCompleted ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{item.subject}</span>
                    <Badge variant="outline" className="capitalize text-[10px] font-normal">
                      {item.type}
                    </Badge>
                    <Badge
                      variant={isCompleted ? "default" : "outline"}
                      className={`text-[10px] ${
                        isCompleted
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "text-amber-600 border-amber-500/20"
                      }`}
                    >
                      {item.status}
                    </Badge>
                  </div>

                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{item.description}</p>
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
                    {item.user && <span>Logged by {item.user}</span>}
                    <span>• {formatDate(item.createdAt)}</span>
                    {item.dueDate && <span>• Due: {formatDate(item.dueDate)}</span>}
                  </div>
                </div>

                {canEdit && !isCompleted && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleComplete(item.id)}
                    className="h-8 gap-1 text-xs text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
                  >
                    <Check className="w-3 h-3" />
                    Complete
                  </Button>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Log Activity Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Client Activity</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="actType">Activity Type *</Label>
                <select
                  id="actType"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="call">Phone Call</option>
                  <option value="meeting">In-Person / Virtual Meeting</option>
                  <option value="email">Email Sent/Received</option>
                  <option value="whatsapp">WhatsApp Discussion</option>
                  <option value="note">Internal Review Note</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
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
              <Label htmlFor="actSubject">Subject / Topic *</Label>
              <Input
                id="actSubject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Discussed revised cable schedules with Procurement"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="actCompany">Associated Client Company</Label>
              <select
                id="actCompany"
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
              <Label htmlFor="actOpp">Linked Opportunity Deal</Label>
              <select
                id="actOpp"
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

            <div className="space-y-1">
              <Label htmlFor="dueDate">Action Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="actDesc">Details / Discussion Points</Label>
              <Textarea
                id="actDesc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Key meeting notes, agreements, next action items..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Activity
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
