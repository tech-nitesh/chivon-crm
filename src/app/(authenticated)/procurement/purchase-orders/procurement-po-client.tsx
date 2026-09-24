"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  FileText,
  Plus,
  Building2,
  Calendar,
  Loader2,
  DollarSign,
  PackageCheck,
  ShoppingBag,
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
import { useRouter } from "next/navigation"

interface ProcurementPOClientProps {
  vendors: any[]
  requests: any[]
  permissions: string[]
}

export function ProcurementPOClient({ vendors, requests, permissions }: ProcurementPOClientProps) {
  const router = useRouter()
  const canCreate = hasPermission(permissions, "vendors.create")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Local simulated supplier LPO records
  const [lpos, setLpos] = useState([
    {
      id: "lpo-001",
      lpoNumber: "LPO-2024-041",
      vendorName: "Siemens Middle East FZ-LLC",
      itemsSummary: "S7-1500 PLC & I/O Modules (2 sets)",
      amount: 48500,
      deliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      status: "issued",
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "lpo-002",
      lpoNumber: "LPO-2024-042",
      vendorName: "Schneider Electric Gulf",
      itemsSummary: "Compact NSX 400A MCCB & Contactor Units",
      amount: 22800,
      deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: "in_transit",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ])

  // Form state
  const [vendorName, setVendorName] = useState("")
  const [lpoNumber, setLpoNumber] = useState(`LPO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`)
  const [itemsSummary, setItemsSummary] = useState("")
  const [amount, setAmount] = useState<number | string>("")
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  )

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendorName || !amount) return
    setLoading(true)
    setTimeout(() => {
      setLpos([
        {
          id: `lpo-${Date.now()}`,
          lpoNumber,
          vendorName,
          itemsSummary: itemsSummary || "BOM Procurement Components",
          amount: Number(amount),
          deliveryDate,
          status: "issued",
          createdAt: new Date().toISOString(),
        },
        ...lpos,
      ])
      setIsDialogOpen(false)
      setLoading(false)
    }, 400)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
            Supplier Purchase Orders (LPO)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Official Local Purchase Orders issued to suppliers and equipment OEMs
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Issue Supplier LPO
          </Button>
        )}
      </div>

      {/* LPO Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>LPO Number</th>
                <th>Supplier / Vendor</th>
                <th>Scope of Procurement</th>
                <th>Order Value (AED)</th>
                <th>Expected Delivery</th>
                <th>Issue Date</th>
                <th>Fulfillment Status</th>
              </tr>
            </thead>
            <tbody>
              {lpos.map((lpo) => (
                <tr key={lpo.id} className="hover:bg-muted/40 transition-colors">
                  <td>
                    <span className="font-mono text-xs font-semibold text-primary">
                      {lpo.lpoNumber}
                    </span>
                  </td>
                  <td>
                    <div className="font-medium text-foreground text-sm flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      {lpo.vendorName}
                    </div>
                  </td>
                  <td>
                    <span className="text-xs text-muted-foreground line-clamp-1 max-w-[280px]">
                      {lpo.itemsSummary}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-sm font-bold text-foreground">
                      {formatCurrency(lpo.amount)}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(lpo.deliveryDate)}
                    </div>
                  </td>
                  <td>
                    <span className="text-xs text-muted-foreground">{formatDate(lpo.createdAt)}</span>
                  </td>
                  <td>
                    <Badge
                      variant="outline"
                      className={`capitalize text-xs ${
                        lpo.status === "in_transit"
                          ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                          : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      }`}
                    >
                      {lpo.status.replace("_", " ")}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue LPO Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Issue Official Supplier LPO
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label className="text-xs">Supplier / Vendor *</Label>
              <select
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">Select Vendor...</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.name}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">LPO Number *</Label>
                <Input
                  value={lpoNumber}
                  onChange={(e) => setLpoNumber(e.target.value)}
                  className="mt-1.5 font-mono"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">LPO Value (AED) *</Label>
                <Input
                  type="number"
                  placeholder="e.g. 35000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Committed Delivery Date</Label>
              <Input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label className="text-xs">Scope / BOM Line Items Summary</Label>
              <Textarea
                rows={2}
                placeholder="Specific part numbers, quantities, brand models..."
                value={itemsSummary}
                onChange={(e) => setItemsSummary(e.target.value)}
                className="mt-1.5 text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Issue Official LPO
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
