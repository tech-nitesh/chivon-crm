"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  FolderKanban,
  Plus,
  Search,
  Building2,
  Calendar,
  Loader2,
  DollarSign,
  User,
  CheckCircle2,
  Clock,
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
import { createProject, updateProjectStage } from "./actions"

interface ProjectItem {
  id: string
  businessId: string
  title: string
  description: string | null
  company: { id: string; name: string; businessId: string }
  manager: string
  contractValue: number
  stage: string
  priority: string
  status: string
  startDate: string | null
  endDate: string | null
  progress: number
  tasksCount: number
  milestonesCount: number
  createdAt: string
}

interface ProjectsClientProps {
  projects: ProjectItem[]
  options: {
    companies: { id: string; name: string; businessId: string }[]
    managers: { id: string; firstName: string; lastName: string }[]
  }
  search: string
  stage: string
  permissions: string[]
}

const STAGES = [
  { id: "po_received", label: "PO Received" },
  { id: "kickoff", label: "Kickoff" },
  { id: "engineering", label: "Engineering Design" },
  { id: "procurement", label: "BOM Procurement" },
  { id: "fabrication", label: "Fabrication & Assembly" },
  { id: "installation", label: "Site Installation" },
  { id: "commissioning", label: "Testing & Commissioning" },
  { id: "completed", label: "Handover & Closed" },
]

const stageBadgeStyles: Record<string, string> = {
  po_received: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  kickoff: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  engineering: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  procurement: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  fabrication: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  installation: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  commissioning: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold",
}

export function ProjectsClient({
  projects,
  options,
  search: initialSearch,
  stage: initialStage,
  permissions,
}: ProjectsClientProps) {
  const router = useRouter()
  const canCreate = hasPermission(permissions, "projects.create")
  const canEdit = hasPermission(permissions, "projects.edit")

  const [search, setSearch] = useState(initialSearch)
  const [stage, setStage] = useState(initialStage)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [companyId, setCompanyId] = useState("")
  const [title, setTitle] = useState("")
  const [contractValue, setContractValue] = useState<number | string>("")
  const [managerId, setManagerId] = useState("")
  const [priority, setPriority] = useState("medium")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  )
  const [description, setDescription] = useState("")

  const totalContract = projects.reduce((sum, p) => sum + p.contractValue, 0)

  const handleFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const p = new URLSearchParams()
    if (search) p.set("search", search)
    if (stage !== "all") p.set("stage", stage)
    router.push(`/projects?${p.toString()}`)
  }

  const handleStageChange = async (id: string, newStage: string) => {
    try {
      setLoadingId(id)
      await updateProjectStage(id, newStage)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingId(null)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !title || !contractValue) {
      setError("Please fill all required fields")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await createProject({
        companyId,
        title,
        contractValue: Number(contractValue),
        managerId: managerId || undefined,
        priority,
        startDate,
        endDate,
        description: description || undefined,
      })
      if (res.success) {
        setIsDialogOpen(false)
        router.refresh()
      } else {
        setError(res.error || "Failed to create project")
      }
    } catch (err: any) {
      setError(err.message || "Failed to create project")
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
            <FolderKanban className="w-6 h-6 text-primary" />
            Engineering Projects & Execution
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track multi-discipline turnkey industrial projects from kickoff to site commissioning
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Project
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <span className="text-xs text-muted-foreground">Active Order Book (Contract Value)</span>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            {formatCurrency(totalContract)}
          </div>
        </div>
        <div className="card p-4">
          <span className="text-xs text-muted-foreground">Active Turnkey Projects</span>
          <div className="text-xl font-bold font-mono text-primary mt-1">
            {projects.length} Industrial Jobs
          </div>
        </div>
        <div className="card p-4">
          <span className="text-xs text-muted-foreground">Avg. Project Milestone Completion</span>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            {projects.length > 0
              ? `${Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)}%`
              : "0%"}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by project ID, title, or client company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={stage}
            onChange={(e) => {
              setStage(e.target.value)
              const p = new URLSearchParams()
              if (search) p.set("search", search)
              if (e.target.value !== "all") p.set("stage", e.target.value)
              router.push(`/projects?${p.toString()}`)
            }}
            className="px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Project Stages</option>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>
      </div>

      {/* Projects Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project ID</th>
                <th>Title & Client</th>
                <th>Project Manager</th>
                <th>Contract Value</th>
                <th>Execution Stage</th>
                <th>Task Progress</th>
                <th>Target Handover</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <FolderKanban className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No engineering projects found matching your criteria.
                  </td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                    <td>
                      <span className="font-mono text-xs font-semibold text-primary">
                        {p.businessId}
                      </span>
                    </td>
                    <td>
                      <div className="font-semibold text-foreground text-sm">{p.title}</div>
                      <div className="font-medium text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <Link href={`/customers/companies/${p.company.id}`} className="hover:text-primary">
                          {p.company.name}
                        </Link>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground">{p.manager}</span>
                    </td>
                    <td>
                      <span className="font-mono text-sm font-bold text-foreground">
                        {formatCurrency(p.contractValue)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={p.stage}
                          disabled={!canEdit || loadingId === p.id}
                          onChange={(e) => handleStageChange(p.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-md border border-input focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer capitalize ${stageBadgeStyles[p.stage] || "bg-muted text-foreground"}`}
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        {loadingId === p.id && (
                          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">
                          {p.progress}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {p.endDate ? formatDate(p.endDate) : "TBD"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Project Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-primary" />
              Initiate Engineering Project
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
              <Label className="text-xs">Project Title *</Label>
              <Input
                placeholder="e.g. Ruwais Refinery Automation Overhaul"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Contract Value (AED) *</Label>
                <Input
                  type="number"
                  placeholder="e.g. 240000"
                  value={contractValue}
                  onChange={(e) => setContractValue(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Lead Project Manager</Label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Assign PM...</option>
                  {options.managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-xs">Target Commissioning</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Scope & Objectives</Label>
              <Textarea
                rows={2}
                placeholder="Key deliverables, PLC platforms, site constraints..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1.5 text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Kickoff Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
