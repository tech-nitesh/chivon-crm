"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createOpportunity } from "../actions"

interface NewOpportunityFormProps {
  companies: { id: string; name: string; businessId: string }[]
  contacts: { id: string; firstName: string; lastName: string; companyId: string; designation: string | null }[]
  users: { id: string; firstName: string; lastName: string }[]
  initialCompanyId: string
  currentUserId: string
}

export function NewOpportunityForm({
  companies,
  contacts,
  users,
  initialCompanyId,
  currentUserId,
}: NewOpportunityFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const [form, setForm] = useState({
    companyId: initialCompanyId || (companies[0]?.id ?? ""),
    contactId: "",
    title: "",
    estimatedValue: 0,
    stage: "qualified" as any,
    probability: 20,
    expectedCloseDate: "",
    notes: "",
  })

  const filteredContacts = contacts.filter((c) => c.companyId === form.companyId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setFieldErrors({})

    try {
      const result = await createOpportunity({
        ...form,
        contactId: form.contactId || undefined,
        estimatedValue: Number(form.estimatedValue) || 0,
        expectedCloseDate: form.expectedCloseDate || undefined,
        notes: form.notes || undefined,
      })

      if (result.success) {
        router.push(`/sales/opportunities/${result.data.id}`)
      } else {
        setError(result.error)
        if (result.fieldErrors) setFieldErrors(result.fieldErrors)
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/sales/opportunities">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Opportunities
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Create Deal Opportunity</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Initialize an active commercial opportunity in the sales forecast pipeline
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
            <CardTitle className="text-sm font-semibold">Deal & Account Identification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Opportunity Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Turnkey Substation Automation & SCADA Upgrade"
                required
              />
              {fieldErrors.title && (
                <p className="text-xs text-destructive">{fieldErrors.title[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="companyId">Client / Account *</Label>
                <select
                  id="companyId"
                  value={form.companyId}
                  onChange={(e) => setForm({ ...form, companyId: e.target.value, contactId: "" })}
                  required
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select Account</option>
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
                <Label htmlFor="contactId">Key Contact Person</Label>
                <select
                  id="contactId"
                  value={form.contactId}
                  onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select Contact (optional)</option>
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
            <CardTitle className="text-sm font-semibold">Forecast & Commercial Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="estimatedValue">Deal Value (AED) *</Label>
                <Input
                  id="estimatedValue"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.estimatedValue || ""}
                  onChange={(e) => setForm({ ...form, estimatedValue: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 250000"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stage">Initial Stage</Label>
                <select
                  id="stage"
                  value={form.stage}
                  onChange={(e) => {
                    const st = e.target.value
                    const probs: Record<string, number> = {
                      qualified: 10,
                      technical: 30,
                      site_visit: 40,
                      quotation: 60,
                      negotiation: 80,
                      awaiting_po: 90,
                    }
                    setForm({ ...form, stage: st as any, probability: probs[st] || 10 })
                  }}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="qualified">Qualified Lead (10%)</option>
                  <option value="technical">Technical Review (30%)</option>
                  <option value="site_visit">Site Visit / Survey (40%)</option>
                  <option value="quotation">Quotation Prepared (60%)</option>
                  <option value="negotiation">Negotiation (80%)</option>
                  <option value="awaiting_po">Awaiting PO (90%)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="probability">Probability (%)</Label>
                <Input
                  id="probability"
                  type="number"
                  min="0"
                  max="100"
                  value={form.probability}
                  onChange={(e) => setForm({ ...form, probability: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
              <Input
                id="expectedCloseDate"
                type="date"
                value={form.expectedCloseDate}
                onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Deal Notes / Strategic Considerations</Label>
              <Textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Competitor dynamics, margin targets, critical success factors..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/sales/opportunities">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Opportunity
          </Button>
        </div>
      </form>
    </div>
  )
}
