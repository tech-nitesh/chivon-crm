"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  FileSpreadsheet,
  Plus,
  Search,
  Building2,
  TrendingUp,
  Loader2,
  Trash2,
  DollarSign,
  Percent,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatCurrency, formatDate } from "@/lib/utils"
import { hasPermission } from "@/lib/permissions"
import { createBOQ } from "../actions"

interface BOQItemData {
  id: string
  businessId: string
  title: string
  status: string
  totalCost: number
  totalSelling: number
  margin: number
  totalItems: number
  sectionsCount: number
  opportunity: { id: string; businessId: string; title: string; company: { id: string; name: string } }
  createdAt: string
}

interface BOQClientProps {
  boqs: BOQItemData[]
  options: {
    opportunities: { id: string; businessId: string; title: string; company: { id: string; name: string } }[]
  }
  search: string
  permissions: string[]
}

export function BOQClient({
  boqs,
  options,
  search: initialSearch,
  permissions,
}: BOQClientProps) {
  const router = useRouter()
  const canEdit = hasPermission(permissions, "technical.edit")

  const [search, setSearch] = useState(initialSearch)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // BOQ Builder Form state
  const [opportunityId, setOpportunityId] = useState("")
  const [title, setTitle] = useState("")
  const [sections, setSections] = useState([
    {
      title: "Main Equipment & Hardware",
      items: [
        {
          description: "Siemens S7-1500 PLC CPU + Power Supply",
          specification: "6ES7511-1AK02-0AB0",
          quantity: 1,
          unit: "set",
          costPrice: 12000,
          sellingPrice: 16500,
        },
      ],
    },
  ])

  // Real-time calculations
  const totalCost = sections.reduce(
    (acc, sec) => acc + sec.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0),
    0
  )
  const totalSelling = sections.reduce(
    (acc, sec) => acc + sec.items.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0),
    0
  )
  const marginPct = totalSelling > 0 ? ((totalSelling - totalCost) / totalSelling) * 100 : 0

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (search) p.set("search", search)
    router.push(`/technical/boq?${p.toString()}`)
  }

  const addSection = () => {
    setSections([
      ...sections,
      {
        title: `Section ${sections.length + 1}`,
        items: [{ description: "", specification: "", quantity: 1, unit: "nos", costPrice: 0, sellingPrice: 0 }],
      },
    ])
  }

  const addItem = (secIndex: number) => {
    const updated = [...sections]
    updated[secIndex].items.push({
      description: "",
      specification: "",
      quantity: 1,
      unit: "nos",
      costPrice: 0,
      sellingPrice: 0,
    })
    setSections(updated)
  }

  const removeItem = (secIndex: number, itemIndex: number) => {
    const updated = [...sections]
    updated[secIndex].items.splice(itemIndex, 1)
    if (updated[secIndex].items.length === 0) {
      updated.splice(secIndex, 1)
    }
    setSections(updated)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!opportunityId) {
      setError("Please select an opportunity")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await createBOQ({
        opportunityId,
        title,
        sections,
      })
      if (res.success) {
        setIsDialogOpen(false)
        setTitle("")
        setOpportunityId("")
        router.refresh()
      } else {
        setError("Failed to create BOQ")
      }
    } catch (err: any) {
      setError(err.message || "Failed to create BOQ")
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
            <FileSpreadsheet className="w-6 h-6 text-primary" />
            Bill of Quantities (BOQ)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Engineered costing sheets, component pricing, and gross margin modeling
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create BOQ
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <form onSubmit={handleFilter} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by BOQ ID, title, opportunity, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>
      </div>

      {/* BOQ Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>BOQ ID</th>
                <th>Title & Opportunity</th>
                <th>Company</th>
                <th>Sections / Items</th>
                <th>Total Cost</th>
                <th>Total Selling</th>
                <th>Margin</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {boqs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted-foreground">
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No BOQ sheets created yet.
                  </td>
                </tr>
              ) : (
                boqs.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/40 transition-colors">
                    <td>
                      <span className="font-mono text-xs font-semibold text-primary">
                        {b.businessId}
                      </span>
                    </td>
                    <td>
                      <div className="font-semibold text-foreground text-sm">{b.title}</div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground font-mono">
                        <TrendingUp className="w-3 h-3 text-purple-600" />
                        <Link href={`/sales/opportunities/${b.opportunity.id}`} className="hover:underline">
                          {b.opportunity.businessId}: {b.opportunity.title}
                        </Link>
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-foreground text-sm flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        {b.opportunity.company.name}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground">
                        {b.sectionsCount} sections ({b.totalItems} items)
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs font-medium text-muted-foreground">
                        {formatCurrency(b.totalCost)}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs font-bold text-foreground">
                        {formatCurrency(b.totalSelling)}
                      </span>
                    </td>
                    <td>
                      <Badge
                        variant="outline"
                        className={
                          b.margin >= 25
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-mono"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20 font-mono"
                        }
                      >
                        {b.margin.toFixed(1)}%
                      </Badge>
                    </td>
                    <td>
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {b.status}
                      </Badge>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground">{formatDate(b.createdAt)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOQ Builder Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Engineering BOQ Costing Sheet Builder
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Link to Opportunity</Label>
                <select
                  value={opportunityId}
                  onChange={(e) => setOpportunityId(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
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
                <Label className="text-xs">BOQ Title</Label>
                <Input
                  placeholder="e.g. Turnkey Automation & Cable Schedule BOQ"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
            </div>

            {/* Sections & Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Cost Breakdown & Line Items</h3>
                <Button type="button" variant="outline" size="sm" onClick={addSection}>
                  + Add Section
                </Button>
              </div>

              {sections.map((section, sIdx) => (
                <div key={sIdx} className="border border-border rounded-lg p-3 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <Input
                      value={section.title}
                      onChange={(e) => {
                        const updated = [...sections]
                        updated[sIdx].title = e.target.value
                        setSections(updated)
                      }}
                      className="font-medium text-sm max-w-xs"
                      placeholder="Section Title"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addItem(sIdx)}
                      className="text-xs"
                    >
                      + Add Item
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {section.items.map((item, iIdx) => (
                      <div key={iIdx} className="grid grid-cols-12 gap-2 items-center text-xs">
                        <div className="col-span-4">
                          <Input
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => {
                              const updated = [...sections]
                              updated[sIdx].items[iIdx].description = e.target.value
                              setSections(updated)
                            }}
                            className="h-8 text-xs"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            placeholder="Spec / Part No."
                            value={item.specification}
                            onChange={(e) => {
                              const updated = [...sections]
                              updated[sIdx].items[iIdx].specification = e.target.value
                              setSections(updated)
                            }}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-1">
                          <Input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = [...sections]
                              updated[sIdx].items[iIdx].quantity = Number(e.target.value) || 0
                              setSections(updated)
                            }}
                            className="h-8 text-xs"
                            min="1"
                            required
                          />
                        </div>
                        <div className="col-span-1">
                          <Input
                            placeholder="Unit"
                            value={item.unit}
                            onChange={(e) => {
                              const updated = [...sections]
                              updated[sIdx].items[iIdx].unit = e.target.value
                              setSections(updated)
                            }}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="Cost Price"
                            value={item.costPrice}
                            onChange={(e) => {
                              const updated = [...sections]
                              updated[sIdx].items[iIdx].costPrice = Number(e.target.value) || 0
                              setSections(updated)
                            }}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-1">
                          <Input
                            type="number"
                            placeholder="Selling"
                            value={item.sellingPrice}
                            onChange={(e) => {
                              const updated = [...sections]
                              updated[sIdx].items[iIdx].sellingPrice = Number(e.target.value) || 0
                              setSections(updated)
                            }}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-1 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => removeItem(sIdx, iIdx)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary Strip */}
            <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted border border-border">
              <div>
                <span className="text-xs text-muted-foreground">Total Direct Cost</span>
                <div className="text-base font-bold font-mono text-foreground mt-0.5">
                  {formatCurrency(totalCost)}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Proposed Selling Price</span>
                <div className="text-base font-bold font-mono text-primary mt-0.5">
                  {formatCurrency(totalSelling)}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Expected Gross Margin</span>
                <div className="text-base font-bold font-mono text-emerald-600 mt-0.5">
                  {marginPct.toFixed(1)}% (Profit: {formatCurrency(totalSelling - totalCost)})
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Generate & Save BOQ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
