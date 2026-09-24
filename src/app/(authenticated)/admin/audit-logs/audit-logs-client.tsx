"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Shield,
  Search,
  User,
  Clock,
  Activity,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

interface AuditLogItem {
  id: string
  action: string
  entityType: string
  entityId: string
  before: string | null
  after: string | null
  ipAddress: string | null
  user: string
  createdAt: string
}

interface AuditLogsClientProps {
  logs: AuditLogItem[]
  search: string
  entityType: string
  permissions: string[]
}

const actionStyles: Record<string, string> = {
  create: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  update: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  delete: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  status_change: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  approval: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  rejection: "bg-red-500/10 text-red-600 border-red-500/20",
}

export function AuditLogsClient({
  logs,
  search: initialSearch,
  entityType: initialEntity,
}: AuditLogsClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [entityType, setEntityType] = useState(initialEntity)

  const handleFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const p = new URLSearchParams()
    if (search) p.set("search", search)
    if (entityType !== "all") p.set("entityType", entityType)
    router.push(`/admin/audit-logs?${p.toString()}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Immutable Security & Operational Audit Trail
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cryptographically timestamped record of user transactions, permission checks, and data modifications
        </p>
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by action, user, or entity ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value)
              const p = new URLSearchParams()
              if (search) p.set("search", search)
              if (e.target.value !== "all") p.set("entityType", e.target.value)
              router.push(`/admin/audit-logs?${p.toString()}`)
            }}
            className="px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring capitalize"
          >
            <option value="all">All Entity Types</option>
            <option value="inquiry">Inquiries</option>
            <option value="opportunity">Opportunities</option>
            <option value="quotation">Quotations</option>
            <option value="invoice">Invoices</option>
            <option value="payment">Payments</option>
            <option value="project">Projects</option>
            <option value="vendor">Vendors</option>
            <option value="user">Users</option>
          </select>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>
      </div>

      {/* Logs Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Staff User</th>
                <th>Action</th>
                <th>Entity Type</th>
                <th>Entity Ref</th>
                <th>Snapshot / State Changes</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No audit records match your search filter.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/40 transition-colors">
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(l.createdAt)}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs font-medium text-foreground">{l.user}</div>
                    </td>
                    <td>
                      <Badge
                        variant="outline"
                        className={`capitalize text-xs font-mono ${actionStyles[l.action] || ""}`}
                      >
                        {l.action.replace("_", " ")}
                      </Badge>
                    </td>
                    <td>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {l.entityType}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-foreground font-medium">
                        {l.entityId}
                      </span>
                    </td>
                    <td>
                      <div className="text-xs font-mono text-muted-foreground max-w-[320px] truncate bg-muted/40 p-1 rounded">
                        {l.after || l.before || "—"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
