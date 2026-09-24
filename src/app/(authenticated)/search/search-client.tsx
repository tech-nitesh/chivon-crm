"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  Search,
  Building2,
  Users,
  Inbox,
  Target,
  FileText,
  FolderKanban,
  DollarSign,
  ArrowRight,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface SearchResults {
  companies: Array<{ id: string; businessId: string; name: string; city: string | null; country: string | null }>
  contacts: Array<{ id: string; firstName: string; lastName: string; email: string | null; phone: string | null; company: { id: string; name: string } | null }>
  inquiries: Array<{ id: string; businessId: string; discipline: string; scope: string; status: string; clientName: string }>
  opportunities: Array<{ id: string; businessId: string; title: string; stage: string; estimatedValue: number | null }>
  quotations: Array<{ id: string; quotationNumber: string; title: string; status: string; totalAmount: number }>
  projects: Array<{ id: string; projectNumber: string; name: string; stage: string; contractValue: number }>
  invoices: Array<{ id: string; invoiceNumber: string; status: string; totalAmount: number }>
}

interface SearchClientProps {
  initialQuery: string
  initialResults: SearchResults
}

export function SearchClient({ initialQuery, initialResults }: SearchClientProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const totalResults =
    initialResults.companies.length +
    initialResults.contacts.length +
    initialResults.inquiries.length +
    initialResults.opportunities.length +
    initialResults.quotations.length +
    initialResults.projects.length +
    initialResults.invoices.length

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Enterprise Search</h1>
        <p className="text-muted-foreground text-sm">
          Unified real-time search across customers, pipeline, quotations, engineering, and finance
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, ID, phone, email, project or invoice number..."
            className="pl-9 h-11"
          />
        </div>
        <Button type="submit" className="h-11 px-6">
          Search
        </Button>
      </form>

      {query && (
        <div className="text-sm text-muted-foreground">
          Found <span className="font-semibold text-foreground">{totalResults}</span> matches for &ldquo;{initialQuery}&rdquo;
        </div>
      )}

      {totalResults === 0 && query && (
        <div className="text-center py-16 bg-card border rounded-lg">
          <Search className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold text-lg">No results found</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Try searching for a different keyword, account name, reference ID or project tag.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Companies */}
        {initialResults.companies.length > 0 && (
          <div className="bg-card border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-sm border-b pb-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span>Companies ({initialResults.companies.length})</span>
            </div>
            <div className="space-y-2">
              {initialResults.companies.map((c) => (
                <Link
                  key={c.id}
                  href={`/customers/companies`}
                  className="flex items-center justify-between p-2 rounded hover:bg-secondary transition-colors text-sm"
                >
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.businessId} • {c.city || "UAE"}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-60" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Contacts */}
        {initialResults.contacts.length > 0 && (
          <div className="bg-card border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-sm border-b pb-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span>Contacts ({initialResults.contacts.length})</span>
            </div>
            <div className="space-y-2">
              {initialResults.contacts.map((c) => (
                <Link
                  key={c.id}
                  href={`/customers/contacts`}
                  className="flex items-center justify-between p-2 rounded hover:bg-secondary transition-colors text-sm"
                >
                  <div>
                    <div className="font-medium">{c.firstName} {c.lastName}</div>
                    <div className="text-xs text-muted-foreground">{c.email || c.phone || "No direct contact"} • {c.company?.name || "Independent"}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-60" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Inquiries */}
        {initialResults.inquiries.length > 0 && (
          <div className="bg-card border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-sm border-b pb-2">
              <Inbox className="h-4 w-4 text-amber-500" />
              <span>Inquiries ({initialResults.inquiries.length})</span>
            </div>
            <div className="space-y-2">
              {initialResults.inquiries.map((i) => (
                <Link
                  key={i.id}
                  href={`/sales/inquiries`}
                  className="flex items-center justify-between p-2 rounded hover:bg-secondary transition-colors text-sm"
                >
                  <div>
                    <div className="font-medium">{i.discipline}: {i.scope}</div>
                    <div className="text-xs text-muted-foreground">{i.businessId} • {i.clientName || "Direct"}</div>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">{i.status.replace(/_/g, " ")}</Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Opportunities */}
        {initialResults.opportunities.length > 0 && (
          <div className="bg-card border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-sm border-b pb-2">
              <Target className="h-4 w-4 text-purple-500" />
              <span>Opportunities ({initialResults.opportunities.length})</span>
            </div>
            <div className="space-y-2">
              {initialResults.opportunities.map((o) => (
                <Link
                  key={o.id}
                  href={`/sales/opportunities`}
                  className="flex items-center justify-between p-2 rounded hover:bg-secondary transition-colors text-sm"
                >
                  <div>
                    <div className="font-medium">{o.title}</div>
                    <div className="text-xs text-muted-foreground">{o.businessId} • {o.estimatedValue ? `AED ${o.estimatedValue.toLocaleString()}` : "Value TBD"}</div>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">{o.stage.replace(/_/g, " ")}</Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quotations */}
        {initialResults.quotations.length > 0 && (
          <div className="bg-card border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-sm border-b pb-2">
              <FileText className="h-4 w-4 text-emerald-500" />
              <span>Quotations ({initialResults.quotations.length})</span>
            </div>
            <div className="space-y-2">
              {initialResults.quotations.map((q) => (
                <Link
                  key={q.id}
                  href={`/commercial/quotations`}
                  className="flex items-center justify-between p-2 rounded hover:bg-secondary transition-colors text-sm"
                >
                  <div>
                    <div className="font-medium">{q.title}</div>
                    <div className="text-xs text-muted-foreground">{q.quotationNumber} • AED {q.totalAmount.toLocaleString()}</div>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">{q.status.replace(/_/g, " ")}</Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {initialResults.projects.length > 0 && (
          <div className="bg-card border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-sm border-b pb-2">
              <FolderKanban className="h-4 w-4 text-cyan-500" />
              <span>Projects ({initialResults.projects.length})</span>
            </div>
            <div className="space-y-2">
              {initialResults.projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects`}
                  className="flex items-center justify-between p-2 rounded hover:bg-secondary transition-colors text-sm"
                >
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.projectNumber} • AED {p.contractValue.toLocaleString()}</div>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">{p.stage.replace(/_/g, " ")}</Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Invoices */}
        {initialResults.invoices.length > 0 && (
          <div className="bg-card border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-sm border-b pb-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span>Invoices ({initialResults.invoices.length})</span>
            </div>
            <div className="space-y-2">
              {initialResults.invoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/accounting/invoices`}
                  className="flex items-center justify-between p-2 rounded hover:bg-secondary transition-colors text-sm"
                >
                  <div>
                    <div className="font-medium">{inv.invoiceNumber}</div>
                    <div className="text-xs text-muted-foreground">AED {inv.totalAmount.toLocaleString()}</div>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">{inv.status.replace(/_/g, " ")}</Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
