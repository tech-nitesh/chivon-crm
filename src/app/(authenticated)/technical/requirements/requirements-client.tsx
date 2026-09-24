"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Wrench,
  Plus,
  Search,
  Building2,
  TrendingUp,
  FileCheck,
  Loader2,
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
import { formatDate } from "@/lib/utils"
import { hasPermission } from "@/lib/permissions"
import { createTechnicalRequirement } from "../actions"

interface RequirementItem {
  id: string
  serviceType: string
  equipmentTag: string | null
  standards: string | null
  status: string
  opportunity: {
    id: string
    businessId: string
    title: string
    company: { id: string; name: string }
  }
  createdAt: string
}

interface RequirementsClientProps {
  requirements: RequirementItem[]
  options: {
    opportunities: { id: string; businessId: string; title: string; company: { id: string; name: string } }[]
    users: { id: string; firstName: string; lastName: string }[]
  }
  search: string
  permissions: string[]
}

export function RequirementsClient({
  requirements,
  options,
  search: initialSearch,
  permissions,
}: RequirementsClientProps) {
  const router = useRouter()
  const canEdit = hasPermission(permissions, "technical.edit")

  const [search, setSearch] = useState(initialSearch)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    opportunityId: options.opportunities[0]?.id || "",
    serviceType: "plc_automation",
    equipmentTag: "",
    operatingCond: "",
    specifications: "",
    standards: "IEC / ATEX Zone 1",
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/technical/requirements?search=${encodeURIComponent(search)}`)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await createTechnicalRequirement(form)
      if (res.success) {
        setIsDialogOpen(false)
        router.refresh()
      } else {
        setError("Failed to create requirement")
      }
    } catch (err: any) {
      setError(err.message || "Failed to create requirement")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wrench className="w-6 h-6 text-primary" />
            Technical Requirements & Specifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dynamic engineering specifications, operating conditions, and regulatory compliance standards
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Specification
          </Button>
        )}
      </div>

      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search specifications by service, tag, deal, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Deal / Account</th>
                <th>Engineering Discipline</th>
                <th>Equipment Tag</th>
                <th>Standards & Norms</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {requirements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No technical requirements filed yet.
                  </td>
                </tr>
              ) : (
                requirements.map((req) => (
                  <tr key={req.id} className="hover:bg-muted/40 transition-colors">
                    <td>
                      <div className="font-semibold text-sm text-foreground">
                        <Link href={`/sales/opportunities/${req.opportunity.id}`} className="hover:text-primary">
                          {req.opportunity.title}
                        </Link>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] text-primary">{req.opportunity.businessId}</span>
                        <span>•</span>
                        <span>{req.opportunity.company.name}</span>
                      </div>
                    </td>
                    <td>
                      <Badge variant="outline" className="capitalize text-xs font-medium">
                        {req.serviceType.replace("_", " ")}
                      </Badge>
                    </td>
                    <td>
                      <span className="font-mono text-xs font-semibold">{req.equipmentTag || "—"}</span>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground">{req.standards || "Standard ISO"}</span>
                    </td>
                    <td>
                      <Badge variant="outline" className="capitalize text-xs font-normal">
                        {req.status}
                      </Badge>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground">{formatDate(req.createdAt)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Specification Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Technical Specification</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="reqOpp">Linked Opportunity Deal *</Label>
              <select
                id="reqOpp"
                value={form.opportunityId}
                onChange={(e) => setForm({ ...form, opportunityId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground"
                required
              >
                {options.opportunities.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.businessId} - {o.title} ({o.company.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="srvType">Discipline / Service Type</Label>
                <select
                  id="srvType"
                  value={form.serviceType}
                  onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground"
                >
                  <option value="plc_automation">PLC & Automation</option>
                  <option value="electrical_switchgear">Electrical & Switchgear</option>
                  <option value="piping_mechanical">Mechanical & Piping</option>
                  <option value="civil_structural">Civil & Foundation</option>
                  <option value="hvac_cleanrooms">HVAC & Cleanrooms</option>
                  <option value="calibration">Instrumentation Calibration</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="tag">Equipment / Asset Tag</Label>
                <Input
                  id="tag"
                  value={form.equipmentTag}
                  onChange={(e) => setForm({ ...form, equipmentTag: e.target.value })}
                  placeholder="e.g. MCC-PNL-04"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="standards">Applicable Norms / Standards</Label>
              <Input
                id="standards"
                value={form.standards}
                onChange={(e) => setForm({ ...form, standards: e.target.value })}
                placeholder="e.g. IEC 61439, ATEX Zone 1, DEWA specs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="opCond">Operating Conditions</Label>
              <Input
                id="opCond"
                value={form.operatingCond}
                onChange={(e) => setForm({ ...form, operatingCond: e.target.value })}
                placeholder="Ambient 52°C, 95% humidity, coastal industrial atmosphere"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="specs">Detailed Specifications</Label>
              <Textarea
                id="specs"
                rows={3}
                value={form.specifications}
                onChange={(e) => setForm({ ...form, specifications: e.target.value })}
                placeholder="Engineering parameters, IO count, cable sizing, redundancy requirements..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Specification
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
