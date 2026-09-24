"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Users,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Building2,
  Star,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { hasPermission } from "@/lib/permissions"
import { deleteContact } from "../actions"

interface ContactItem {
  id: string
  businessId: string
  name: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  designation: string | null
  department: string | null
  isPrimary: boolean
  isDecisionMaker: boolean
  company: {
    id: string
    name: string
    businessId: string
  }
  inquiriesCount: number
  opportunitiesCount: number
  createdAt: string
}

interface ContactsClientProps {
  data: {
    contacts: ContactItem[]
    total: number
    page: number
    totalPages: number
  }
  search: string
  companyId: string
  permissions: string[]
}

export function ContactsClient({
  data,
  search: initialSearch,
  companyId: initialCompanyId,
  permissions,
}: ContactsClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const canCreate = hasPermission(permissions, "customers.create")
  const canDelete = hasPermission(permissions, "customers.delete")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (initialCompanyId) params.set("companyId", initialCompanyId)
    router.push(`/customers/contacts?${params.toString()}`)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return
    const res = await deleteContact(id)
    if (res.success) {
      router.refresh()
    } else {
      alert(res.error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Contacts Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage customer stakeholders, technical leads, and decision-makers
          </p>
        </div>
        {canCreate && (
          <Link href="/customers/contacts/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Contact
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by contact name, email, phone, company, or designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
          {search && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearch("")
                router.push("/customers/contacts")
              }}
            >
              Clear
            </Button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Company</th>
                <th>Designation & Dept</th>
                <th>Communication</th>
                <th>Inquiries</th>
                <th>Deals</th>
                {canDelete && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data.contacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No contacts found.
                  </td>
                </tr>
              ) : (
                data.contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-muted/40 transition-colors">
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">
                          {contact.name}
                        </span>
                        {contact.isPrimary && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] gap-1 px-1.5 py-0">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            Primary
                          </Badge>
                        )}
                        {contact.isDecisionMaker && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] gap-1 px-1.5 py-0">
                            <ShieldCheck className="w-3 h-3 text-blue-600" />
                            Decision Maker
                          </Badge>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
                        {contact.businessId}
                      </div>
                    </td>
                    <td>
                      <Link
                        href={`/customers/companies/${contact.company.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        {contact.company.name}
                      </Link>
                    </td>
                    <td>
                      <div className="text-sm font-medium">{contact.designation || "—"}</div>
                      {contact.department && (
                        <div className="text-xs text-muted-foreground">{contact.department}</div>
                      )}
                    </td>
                    <td>
                      <div className="space-y-0.5 text-xs">
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            {contact.email}
                          </a>
                        )}
                        {contact.phone && (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {contact.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted">
                        {contact.inquiriesCount}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted">
                        {contact.opportunitiesCount}
                      </span>
                    </td>
                    {canDelete && (
                      <td className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(contact.id, contact.name)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          title="Delete contact"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Showing page {data.page} of {data.totalPages} ({data.total} total contacts)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => {
                  const p = new URLSearchParams()
                  if (search) p.set("search", search)
                  p.set("page", String(data.page - 1))
                  router.push(`/customers/contacts?${p.toString()}`)
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= data.totalPages}
                onClick={() => {
                  const p = new URLSearchParams()
                  if (search) p.set("search", search)
                  p.set("page", String(data.page + 1))
                  router.push(`/customers/contacts?${p.toString()}`)
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
