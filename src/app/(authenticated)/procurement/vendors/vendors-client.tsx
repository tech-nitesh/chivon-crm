"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Factory,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  MapPin,
  Clock,
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
import { formatCurrency, formatDate } from "@/lib/utils"
import { hasPermission } from "@/lib/permissions"
import { createVendor, toggleVendorActive } from "../actions"

interface VendorItem {
  id: string
  businessId: string
  name: string
  contactName: string | null
  email: string | null
  phone: string | null
  city: string | null
  country: string | null
  products: string | null
  paymentTerms: string | null
  leadTime: string | null
  isActive: boolean
  totalSpend: number
  currentPayable: number
  billsCount: number
  createdAt: string
}

interface VendorsClientProps {
  vendors: VendorItem[]
  search: string
  permissions: string[]
}

export function VendorsClient({ vendors, search: initialSearch, permissions }: VendorsClientProps) {
  const router = useRouter()
  const canCreate = hasPermission(permissions, "vendors.create")
  const canEdit = hasPermission(permissions, "vendors.edit")

  const [search, setSearch] = useState(initialSearch)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [name, setName] = useState("")
  const [contactName, setContactName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("Dubai")
  const [country, setCountry] = useState("United Arab Emirates")
  const [products, setProducts] = useState("PLC, SCADA, Switchgear, VFDs, Sensors")
  const [paymentTerms, setPaymentTerms] = useState("30 days net")
  const [leadTime, setLeadTime] = useState("2-3 weeks")
  const [notes, setNotes] = useState("")

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (search) p.set("search", search)
    router.push(`/procurement/vendors?${p.toString()}`)
  }

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await toggleVendorActive(id, !currentActive)
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) {
      setError("Please enter a vendor company name")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await createVendor({
        name,
        contactName: contactName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        city: city || undefined,
        country: country || undefined,
        products: products || undefined,
        paymentTerms: paymentTerms || undefined,
        leadTime: leadTime || undefined,
        notes: notes || undefined,
      })
      if (res.success) {
        setIsDialogOpen(false)
        router.refresh()
      } else {
        setError(res.error || "Failed to create vendor")
      }
    } catch (err: any) {
      setError(err.message || "Failed to create vendor")
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
            <Factory className="w-6 h-6 text-primary" />
            Approved Vendor Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Maintain OEM partners, industrial equipment distributors, and fabrication subcontractors
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Register Vendor
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <form onSubmit={handleFilter} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by vendor name, products, or contact..."
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

      {/* Vendors Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vendor ID</th>
                <th>Supplier Company</th>
                <th>Primary Contact</th>
                <th>Product Categories</th>
                <th>Payment Terms</th>
                <th>Lead Time</th>
                <th>Cumulative Spend</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Factory className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No vendors found matching your search.
                  </td>
                </tr>
              ) : (
                vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/40 transition-colors">
                    <td>
                      <span className="font-mono text-xs font-semibold text-primary">
                        {v.businessId}
                      </span>
                    </td>
                    <td>
                      <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        {v.name}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {v.city ? `${v.city}, ${v.country}` : v.country}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs font-medium text-foreground">{v.contactName || "Sales Desk"}</div>
                      {v.email && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          {v.email}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="text-xs text-muted-foreground max-w-[240px] truncate">
                        {v.products || "Industrial Automation Equipment"}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground">{v.paymentTerms || "30 days net"}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {v.leadTime || "Standard"}
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs font-bold text-foreground">
                        {formatCurrency(v.totalSpend)}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => canEdit && handleToggle(v.id, v.isActive)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                          v.isActive
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                        }`}
                      >
                        {v.isActive ? "Approved" : "Inactive"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Vendor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Factory className="w-5 h-5 text-primary" />
              Register Approved Supplier / Vendor
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label className="text-xs">Supplier / Company Name *</Label>
              <Input
                placeholder="e.g. Siemens Middle East FZ-LLC"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Contact Person</Label>
                <Input
                  placeholder="e.g. Rajesh Kumar"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-xs">Email Address</Label>
                <Input
                  type="email"
                  placeholder="sales@vendor.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Phone Number</Label>
                <Input
                  placeholder="+971 4..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-xs">City / Emirate</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Authorized Products / Brands</Label>
              <Input
                placeholder="e.g. S7-1200, S7-1500, Sinamics Drives, SCADA"
                value={products}
                onChange={(e) => setProducts(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Payment Terms</Label>
                <Input
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-xs">Standard Lead Time</Label>
                <Input
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Add to Approved List
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
