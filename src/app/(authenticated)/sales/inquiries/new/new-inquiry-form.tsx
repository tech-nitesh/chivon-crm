"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createInquiry } from "../actions"

interface NewInquiryFormProps {
  companies: { id: string; name: string; businessId: string }[]
  contacts: { id: string; firstName: string; lastName: string; companyId: string; designation: string | null }[]
  services: { id: string; name: string; description: string | null }[]
  users: { id: string; firstName: string; lastName: string }[]
  initialCompanyId: string
  currentUserId: string
}

export function NewInquiryForm({
  companies,
  contacts,
  services,
  users,
  initialCompanyId,
  currentUserId,
}: NewInquiryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const [form, setForm] = useState({
    companyId: initialCompanyId || (companies[0]?.id ?? ""),
    contactId: "",
    serviceId: "",
    discipline: "Electrical & Instrumentation",
    scope: "",
    location: "",
    estimatedValue: 0,
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    source: "email" as any,
    salespersonId: currentUserId,
    technicalOwnerId: "",
  })

  // Filter contacts by selected company
  const filteredContacts = contacts.filter((c) => c.companyId === form.companyId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setFieldErrors({})

    try {
      const result = await createInquiry({
        ...form,
        contactId: form.contactId || undefined,
        serviceId: form.serviceId || undefined,
        location: form.location || undefined,
        estimatedValue: form.estimatedValue > 0 ? Number(form.estimatedValue) : undefined,
        salespersonId: form.salespersonId || undefined,
        technicalOwnerId: form.technicalOwnerId || undefined,
      })

      if (result.success) {
        router.push(`/sales/inquiries/${result.data.id}`)
      } else {
        setError(result.error)
        if (result.fieldErrors) setFieldErrors(result.fieldErrors)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while creating inquiry")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/sales/inquiries">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Inquiries
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <FileQuestion className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Log New Customer Inquiry</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Record a new client inquiry, tender requirement, or incoming engineering RFP
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {error}
          </div>
        )}

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Client Identification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="companyId">Client / Company *</Label>
                <select
                  id="companyId"
                  value={form.companyId}
                  onChange={(e) => setForm({ ...form, companyId: e.target.value, contactId: "" })}
                  required
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select Company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.businessId})
                    </option>
                  ))}
                </select>
                {fieldErrors.companyId && (
                  <p className="text-xs text-destructive">{fieldErrors.companyId[0]}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactId">Contact Person</Label>
                <select
                  id="contactId"
                  value={form.contactId}
                  onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select Contact Person (optional)</option>
                  {filteredContacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} {c.designation ? `(${c.designation})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Technical & Commercial Scope</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="discipline">Engineering Discipline</Label>
                <select
                  id="discipline"
                  value={form.discipline}
                  onChange={(e) => setForm({ ...form, discipline: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="Electrical & Instrumentation">Electrical & Instrumentation</option>
                  <option value="Mechanical & Piping">Mechanical & Piping</option>
                  <option value="Automation & Control (PLC/SCADA)">Automation & Control (PLC/SCADA)</option>
                  <option value="Civil & Structural">Civil & Structural</option>
                  <option value="HVAC & Cleanrooms">HVAC & Cleanrooms</option>
                  <option value="Fire & Safety Systems">Fire & Safety Systems</option>
                  <option value="Calibration & Maintenance">Calibration & Maintenance</option>
                  <option value="Turnkey Industrial EPC">Turnkey Industrial EPC</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="source">Lead Source</Label>
                <select
                  id="source"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="website">Website RFP</option>
                  <option value="email">Direct Email</option>
                  <option value="whatsapp">WhatsApp Business</option>
                  <option value="phone">Direct Phone Call</option>
                  <option value="referral">Client Referral</option>
                  <option value="tender">Public/Private Tender</option>
                  <option value="existing_customer">Existing Customer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="priority">Inquiry Priority</Label>
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

            <div className="space-y-1.5">
              <Label htmlFor="scope">Scope Description / Requirements *</Label>
              <Textarea
                id="scope"
                rows={4}
                required
                value={form.scope}
                onChange={(e) => setForm({ ...form, scope: e.target.value })}
                placeholder="Detailed description of client's requirements, technical specs, site constraints, or requested deliverables..."
              />
              {fieldErrors.scope && (
                <p className="text-xs text-destructive">{fieldErrors.scope[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="location">Site Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Jebel Ali Free Zone, Dubai"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="estimatedValue">Estimated Budget / Value (AED)</Label>
                <Input
                  id="estimatedValue"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.estimatedValue || ""}
                  onChange={(e) => setForm({ ...form, estimatedValue: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 150000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Ownership & Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="salespersonId">Commercial Sales Lead</Label>
                <select
                  id="salespersonId"
                  value={form.salespersonId}
                  onChange={(e) => setForm({ ...form, salespersonId: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="technicalOwnerId">Technical Lead / Engineer</Label>
                <select
                  id="technicalOwnerId"
                  value={form.technicalOwnerId}
                  onChange={(e) => setForm({ ...form, technicalOwnerId: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/sales/inquiries">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Inquiry
          </Button>
        </div>
      </form>
    </div>
  )
}
