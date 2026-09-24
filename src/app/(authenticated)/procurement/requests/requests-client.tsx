"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  FileCheck,
  Plus,
  FolderKanban,
  User,
  Calendar,
  Loader2,
  Trash2,
  DollarSign,
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
import { createPurchaseRequest, updatePRStatus } from "../actions"

interface PRItem {
  id: string
  department: string | null
  status: string
  requiredDate: string | null
  notes: string | null
  project: { id: string; businessId: string; title: string } | null
  requester: string
  itemsCount: number
  totalEstimated: number
  items: {
    id: string
    description: string
    specification: string | null
    quantity: number
    unit: string
    preferredVendor: string | null
    estimatedCost: number | null
  }[]
  createdAt: string
}

interface RequestsClientProps {
  requests: PRItem[]
  options: {
    projects: { id: string; businessId: string; title: string }[]
    vendors: { id: string; name: string; businessId: string }[]
  }
  status: string
  permissions: string[]
}

const statusBadgeStyles: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  approved: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  ordered: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  received: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold",
  rejected: "bg-rose-500/10 text-rose-600 border-rose-500/20",
}

export function RequestsClient({ requests, options, status: initialStatus, permissions }: RequestsClientProps) {
  const router = useRouter()
  const canCreate = hasPermission(permissions, "vendors.create")
  const canEdit = hasPermission(permissions, "vendors.edit")

  const [status, setStatus] = useState(initialStatus)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // PR Form
  const [projectId, setProjectId] = useState("")
  const [department, setDepartment] = useState("Electrical & Instrumentation")
  const [requiredDate, setRequiredDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  )
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState([
    {
      description: "Schneider Circuit Breakers 63A 3-Pole 10kA",
      specification: "A9N18367",
      quantity: 4,
      unit: "nos",
      preferredVendor: "Schneider Electric / Local Partner",
      estimatedCost: 350,
    },
  ])

  const totalEst = items.reduce((sum, it) => sum + (it.estimatedCost || 0) * it.quantity, 0)

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setLoadingId(id)
      await updatePRStatus(id, newStatus)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingId(null)
    }
  }

  const addItem = () => {
    setItems([
      ...items,
      {
        description: "",
        specification: "",
        quantity: 1,
        unit: "nos",
        preferredVendor: "",
        estimatedCost: 0,
      },
    ])
  }

  const removeItem = (idx: number) => {
    const updated = [...items]
    updated.splice(idx, 1)
    setItems(updated)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await createPurchaseRequest({
        projectId: projectId || undefined,
        department,
        requiredDate,
        notes: notes || undefined,
        items,
      })
      if (res.success) {
        setIsDialogOpen(false)
        router.refresh()
      } else {
        setError(res.error || "Failed to submit purchase request")
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit request")
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
            <FileCheck className="w-6 h-6 text-primary" />
            Material Purchase Requests (PR)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Engineered bill-of-material requisitions, workshop purchase approvals, and parts ordering
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Purchase Request
          </Button>
        )}
      </div>

      {/* Requests Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Requisition Details</th>
                <th>Project Link</th>
                <th>Requested By</th>
                <th>Required By</th>
                <th>Line Items</th>
                <th>Estimated Cost</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No material purchase requests found.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/40 transition-colors">
                    <td>
                      <div className="font-semibold text-foreground text-sm">
                        {r.department || "General Engineering"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-[200px]">
                        {r.items.map((i) => `${i.description} (${i.quantity} ${i.unit})`).join(", ")}
                      </div>
                    </td>
                    <td>
                      {r.project ? (
                        <div className="text-xs font-mono text-purple-600 flex items-center gap-1">
                          <FolderKanban className="w-3 h-3" />
                          <Link href={`/projects`} className="hover:underline">
                            {r.project.businessId}: {r.project.title}
                          </Link>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">General Workshop</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="w-3.5 h-3.5" />
                        {r.requester}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {r.requiredDate ? formatDate(r.requiredDate) : "ASAP"}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground">
                        {r.itemsCount} components
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs font-bold text-foreground">
                        {formatCurrency(r.totalEstimated)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={r.status}
                          disabled={!canEdit || loadingId === r.id}
                          onChange={(e) => handleStatusChange(r.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-md border border-input focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer capitalize ${statusBadgeStyles[r.status] || "bg-muted text-foreground"}`}
                        >
                          <option value="pending">Pending Review</option>
                          <option value="approved">Approved</option>
                          <option value="ordered">Ordered from Supplier</option>
                          <option value="received">Received at Site</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        {loadingId === r.id && (
                          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New PR Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" />
              Create Material Purchase Requisition (PR)
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Link to Project</Label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Workshop / Overhead</option>
                  {options.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.businessId}: {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs">Department / Trade</Label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>

              <div>
                <Label className="text-xs">Required on Site By</Label>
                <Input
                  type="date"
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Bill of Materials / Requisition Items</h3>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="text-xs">
                  + Add Item
                </Button>
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs border border-border p-2 rounded-md bg-muted/20">
                  <div className="col-span-4">
                    <Label className="text-[10px] text-muted-foreground">Item Description *</Label>
                    <Input
                      placeholder="e.g. S7-1200 CPU 1214C"
                      value={item.description}
                      onChange={(e) => {
                        const updated = [...items]
                        updated[idx].description = e.target.value
                        setItems(updated)
                      }}
                      className="h-8 text-xs mt-1"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[10px] text-muted-foreground">Part # / Spec</Label>
                    <Input
                      placeholder="Part number"
                      value={item.specification}
                      onChange={(e) => {
                        const updated = [...items]
                        updated[idx].specification = e.target.value
                        setItems(updated)
                      }}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label className="text-[10px] text-muted-foreground">Qty *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...items]
                        updated[idx].quantity = Number(e.target.value) || 0
                        setItems(updated)
                      }}
                      className="h-8 text-xs mt-1"
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <Label className="text-[10px] text-muted-foreground">Unit</Label>
                    <Input
                      value={item.unit}
                      onChange={(e) => {
                        const updated = [...items]
                        updated[idx].unit = e.target.value
                        setItems(updated)
                      }}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[10px] text-muted-foreground">Est. Cost (AED)</Label>
                    <Input
                      type="number"
                      value={item.estimatedCost}
                      onChange={(e) => {
                        const updated = [...items]
                        updated[idx].estimatedCost = Number(e.target.value) || 0
                        setItems(updated)
                      }}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label className="text-[10px] text-muted-foreground">Vendor</Label>
                    <Input
                      placeholder="Brand"
                      value={item.preferredVendor}
                      onChange={(e) => {
                        const updated = [...items]
                        updated[idx].preferredVendor = e.target.value
                        setItems(updated)
                      }}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div className="col-span-1 text-right pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={items.length === 1}
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      onClick={() => removeItem(idx)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-muted rounded-md flex justify-between items-center text-xs font-mono">
              <span className="text-muted-foreground">Total Estimated Requisition Cost:</span>
              <span className="font-bold text-sm text-foreground">{formatCurrency(totalEst)}</span>
            </div>

            <div>
              <Label className="text-xs">Requisition Justification / Notes</Label>
              <Textarea
                rows={2}
                placeholder="Site delivery instructions, urgent expediting requirements..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1.5 text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Requisition
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
