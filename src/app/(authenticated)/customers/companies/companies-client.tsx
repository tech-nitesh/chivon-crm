"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/ui/badge"
import { hasPermission } from "@/lib/permissions"
import { formatDate } from "@/lib/utils"

interface CompaniesData {
  companies: Array<{
    id: string
    businessId: string
    name: string
    industry: string | null
    email: string | null
    phone: string | null
    city: string | null
    country: string | null
    owner: string | null
    contactsCount: number
    inquiriesCount: number
    opportunitiesCount: number
    projectsCount: number
    createdAt: string
  }>
  total: number
  page: number
  totalPages: number
}

export function CompaniesClient({
  data,
  search,
  permissions,
}: {
  data: CompaniesData
  search: string
  permissions: string[]
}) {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState(search)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchValue) params.set("search", searchValue)
    router.push(`/customers/companies?${params.toString()}`)
  }

  const canCreate = hasPermission(permissions, "customers.create")

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="page-description">
            Manage your customer companies. {data.total} total companies.
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/customers/companies/new">
              <Plus className="h-4 w-4" />
              New Company
            </Link>
          </Button>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search by name, ID, city, industry..."
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      {/* Table */}
      {data.companies.length === 0 ? (
        <div className="empty-state">
          <Building2 className="empty-state-icon" />
          <p className="empty-state-title">
            {search ? "No companies found" : "No companies yet"}
          </p>
          <p className="empty-state-text">
            {search
              ? `No companies match "${search}". Try a different search term.`
              : "Get started by adding your first customer company."}
          </p>
          {!search && canCreate && (
            <Button asChild className="mt-4">
              <Link href="/customers/companies/new">
                <Plus className="h-4 w-4" />
                Add First Company
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden bg-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Company Name</th>
                  <th>Industry</th>
                  <th>City</th>
                  <th>Contacts</th>
                  <th>Opportunities</th>
                  <th>Projects</th>
                  <th>Owner</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {data.companies.map((company) => (
                  <tr key={company.id}>
                    <td>
                      <Link
                        href={`/customers/companies/${company.id}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {company.businessId}
                      </Link>
                    </td>
                    <td>
                      <Link
                        href={`/customers/companies/${company.id}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {company.name}
                      </Link>
                    </td>
                    <td className="text-muted-foreground">{company.industry || "—"}</td>
                    <td className="text-muted-foreground">{company.city || "—"}</td>
                    <td>{company.contactsCount}</td>
                    <td>{company.opportunitiesCount}</td>
                    <td>{company.projectsCount}</td>
                    <td className="text-muted-foreground">{company.owner || "—"}</td>
                    <td className="text-muted-foreground">{formatDate(company.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((data.page - 1) * 25) + 1}–{Math.min(data.page * 25, data.total)} of {data.total}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page <= 1}
                  onClick={() => {
                    const params = new URLSearchParams()
                    if (search) params.set("search", search)
                    params.set("page", String(data.page - 1))
                    router.push(`/customers/companies?${params.toString()}`)
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page >= data.totalPages}
                  onClick={() => {
                    const params = new URLSearchParams()
                    if (search) params.set("search", search)
                    params.set("page", String(data.page + 1))
                    router.push(`/customers/companies?${params.toString()}`)
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
