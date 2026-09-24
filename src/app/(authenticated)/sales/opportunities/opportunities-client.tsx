"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  TrendingUp,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  Building2,
  User,
  ArrowRight,
  ChevronRight,
  DollarSign,
  Calendar,
  Layers,
  Award,
  AlertCircle,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { hasPermission } from "@/lib/permissions"
import { updateOpportunityStage } from "./actions"

interface OpportunityItem {
  id: string
  businessId: string
  title: string
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
  owner: string | null
  inquiry: {
    id: string
    businessId: string
    discipline: string | null
  } | null
  estimatedValue: number
  stage: string
  probability: number
  expectedCloseDate: string | null
  counts: {
    quotations: number
    siteVisits: number
    technicalRequirements: number
  }
  createdAt: string
}

interface OpportunitiesClientProps {
  data: {
    opportunities: OpportunityItem[]
    total: number
    page: number
    totalPages: number
  }
  search: string
  stage: string
  defaultView: "kanban" | "list"
  permissions: string[]
}

const pipelineStages = [
  { key: "qualified", label: "Qualified", color: "border-blue-500/30 bg-blue-500/5 text-blue-600" },
  { key: "technical", label: "Technical", color: "border-indigo-500/30 bg-indigo-500/5 text-indigo-600" },
  { key: "site_visit", label: "Site Visit", color: "border-cyan-500/30 bg-cyan-500/5 text-cyan-600" },
  { key: "quotation", label: "Quotation", color: "border-amber-500/30 bg-amber-500/5 text-amber-600" },
  { key: "negotiation", label: "Negotiation", color: "border-orange-500/30 bg-orange-500/5 text-orange-600" },
  { key: "awaiting_po", label: "Awaiting PO", color: "border-violet-500/30 bg-violet-500/5 text-violet-600" },
  { key: "won", label: "Closed Won", color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-600" },
  { key: "lost", label: "Closed Lost", color: "border-rose-500/30 bg-rose-500/5 text-rose-600" },
]

export function OpportunitiesClient({
  data,
  search: initialSearch,
  stage: initialStage,
  defaultView,
  permissions,
}: OpportunitiesClientProps) {
  const router = useRouter()
  const [view, setView] = useState<"kanban" | "list">(defaultView)
  const [search, setSearch] = useState(initialSearch)
  const [stageFilter, setStageFilter] = useState(initialStage)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const canCreate = hasPermission(permissions, "opportunities.create")
  const canEdit = hasPermission(permissions, "opportunities.edit")

  // Filter deals by search
  const filteredDeals = data.opportunities.filter((opp) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      opp.title.toLowerCase().includes(term) ||
      opp.businessId.toLowerCase().includes(term) ||
      opp.company.name.toLowerCase().includes(term)
    )
  })

  // Metrics
  const activeDeals = filteredDeals.filter((d) => d.stage !== "won" && d.stage !== "lost")
  const totalActiveValue = activeDeals.reduce((sum, d) => sum + (d.estimatedValue || 0), 0)
  const weightedPipeline = activeDeals.reduce(
    (sum, d) => sum + ((d.estimatedValue || 0) * (d.probability || 0)) / 100,
    0
  )
  const wonValue = filteredDeals
    .filter((d) => d.stage === "won")
    .reduce((sum, d) => sum + (d.estimatedValue || 0), 0)

  const handleAdvanceStage = async (id: string, currentStage: string) => {
    const stageOrder = ["qualified", "technical", "site_visit", "quotation", "negotiation", "awaiting_po", "won"]
    const currentIndex = stageOrder.indexOf(currentStage)
    if (currentIndex === -1 || currentIndex >= stageOrder.length - 1) return

    const nextStage = stageOrder[currentIndex + 1]
    setUpdatingId(id)
    try {
      const res = await updateOpportunityStage(id, nextStage)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.error)
      }
    } catch (err: any) {
      alert(err.message || "Failed to advance stage")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Opportunities Pipeline
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track industrial deals from qualification to commercial close and PO issuance
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-border bg-card p-1">
            <Button
              variant={view === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("kanban")}
              className="h-7 px-2.5 gap-1.5 text-xs font-medium"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kanban
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
              className="h-7 px-2.5 gap-1.5 text-xs font-medium"
            >
              <ListIcon className="w-3.5 h-3.5" />
              List
            </Button>
          </div>

          {canCreate && (
            <Link href="/sales/opportunities/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Opportunity
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Active Pipeline Value
          </div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {formatCurrency(totalActiveValue)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Across {activeDeals.length} open opportunities
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Weighted Forecast
          </div>
          <div className="text-2xl font-bold font-mono text-primary mt-1">
            {formatCurrency(weightedPipeline)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Probability-adjusted expected revenue
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Closed Won Revenue
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {formatCurrency(wonValue)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Successfully closed opportunities
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search deals by title, ID, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {view === "list" && (
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Pipeline Stages</option>
            {pipelineStages.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Kanban Board View */}
      {view === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 min-h-[600px] scrollbar-thin">
          {pipelineStages.map((stageInfo) => {
            const stageDeals = filteredDeals.filter((d) => d.stage === stageInfo.key)
            const stageValue = stageDeals.reduce((sum, d) => sum + (d.estimatedValue || 0), 0)

            return (
              <div
                key={stageInfo.key}
                className="w-80 flex-shrink-0 flex flex-col rounded-xl bg-muted/30 border border-border p-3"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{stageInfo.label}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-mono font-medium text-muted-foreground">
                      {stageDeals.length}
                    </span>
                  </div>
                  <div className="text-xs font-mono font-semibold text-muted-foreground">
                    {formatCurrency(stageValue)}
                  </div>
                </div>

                {/* Stage Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {stageDeals.length === 0 ? (
                    <div className="text-center py-10 text-xs text-muted-foreground italic">
                      No deals in {stageInfo.label}
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="p-3.5 rounded-lg bg-card border border-border hover:border-primary/40 hover:shadow-sm transition-all space-y-2.5 group relative"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/sales/opportunities/${deal.id}`}
                            className="text-xs font-mono font-semibold text-primary hover:underline"
                          >
                            {deal.businessId}
                          </Link>
                          <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-muted">
                            {deal.probability}%
                          </span>
                        </div>

                        <Link href={`/sales/opportunities/${deal.id}`} className="block">
                          <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {deal.title}
                          </h4>
                        </Link>

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{deal.company.name}</span>
                        </div>

                        <div className="pt-2 border-t border-border flex items-center justify-between">
                          <div className="font-mono text-sm font-bold text-foreground">
                            {formatCurrency(deal.estimatedValue)}
                          </div>
                          {canEdit && stageInfo.key !== "won" && stageInfo.key !== "lost" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={updatingId === deal.id}
                              onClick={() => handleAdvanceStage(deal.id, deal.stage)}
                              className="h-7 px-2 text-[11px] gap-1 text-primary hover:bg-primary/10"
                              title="Advance to next stage"
                            >
                              Advance
                              <ChevronRight className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* List View */
        <div className="card overflow-hidden">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Deal ID</th>
                  <th>Title</th>
                  <th>Company</th>
                  <th>Stage</th>
                  <th>Value (AED)</th>
                  <th>Probability</th>
                  <th>Owner</th>
                  <th>Created</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals
                  .filter((d) => stageFilter === "all" || d.stage === stageFilter)
                  .map((deal) => (
                    <tr key={deal.id} className="hover:bg-muted/40 transition-colors">
                      <td className="font-mono font-semibold text-xs text-primary">
                        <Link href={`/sales/opportunities/${deal.id}`} className="hover:underline">
                          {deal.businessId}
                        </Link>
                      </td>
                      <td className="font-medium text-foreground max-w-[260px] truncate">
                        <Link href={`/sales/opportunities/${deal.id}`} className="hover:text-primary">
                          {deal.title}
                        </Link>
                      </td>
                      <td>
                        <Link
                          href={`/customers/companies/${deal.company.id}`}
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          <Building2 className="w-3 h-3" />
                          {deal.company.name}
                        </Link>
                      </td>
                      <td>
                        <Badge variant="outline" className="capitalize text-xs font-normal">
                          {deal.stage.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="font-mono font-semibold text-sm">
                        {formatCurrency(deal.estimatedValue)}
                      </td>
                      <td>
                        <span className="font-mono text-xs">{deal.probability}%</span>
                      </td>
                      <td className="text-xs text-muted-foreground">{deal.owner || "—"}</td>
                      <td className="text-xs text-muted-foreground">{formatDate(deal.createdAt)}</td>
                      <td className="text-right">
                        <Link href={`/sales/opportunities/${deal.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                            View
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
