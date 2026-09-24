"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  FileStack,
  Plus,
  Search,
  FileText,
  Building2,
  Calendar,
  Loader2,
  Download,
  FolderOpen,
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
import { uploadDocumentRecord } from "./actions"

interface DocumentItem {
  id: string
  businessId: string
  fileName: string
  fileType: string
  fileSize: number
  filePath: string
  category: string
  version: number
  notes: string | null
  company: { id: string; name: string; businessId: string } | null
  createdAt: string
}

interface DocumentsClientProps {
  documents: DocumentItem[]
  options: {
    companies: { id: string; name: string; businessId: string }[]
  }
  search: string
  category: string
  permissions: string[]
}

const CATEGORIES = [
  { id: "drawing", label: "CAD / Electrical Drawings" },
  { id: "technical_spec", label: "Technical Specifications" },
  { id: "boq", label: "BOQ Spreadsheets" },
  { id: "quotation", label: "Commercial Proposals" },
  { id: "contract", label: "Contracts & Agreements" },
  { id: "po", label: "Purchase Orders" },
  { id: "site_photo", label: "Site Inspection Photos" },
  { id: "report", label: "Testing / FAT Reports" },
]

export function DocumentsClient({
  documents,
  options,
  search: initialSearch,
  category: initialCategory,
  permissions,
}: DocumentsClientProps) {
  const router = useRouter()
  const canUpload = hasPermission(permissions, "documents.create")

  const [search, setSearch] = useState(initialSearch)
  const [category, setCategory] = useState(initialCategory)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [fileName, setFileName] = useState("")
  const [docCategory, setDocCategory] = useState("drawing")
  const [companyId, setCompanyId] = useState("")
  const [notes, setNotes] = useState("")

  const handleFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const p = new URLSearchParams()
    if (search) p.set("search", search)
    if (category !== "all") p.set("category", category)
    router.push(`/documents?${p.toString()}`)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fileName) {
      setError("Please specify file name")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await uploadDocumentRecord({
        fileName,
        fileType: "application/pdf",
        fileSize: 1024 * 450,
        category: docCategory,
        companyId: companyId || undefined,
        notes: notes || undefined,
      })
      if (res.success) {
        setIsDialogOpen(false)
        router.refresh()
      } else {
        setError(res.error || "Failed to register document")
      }
    } catch (err: any) {
      setError(err.message || "Failed to register document")
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
            <FileStack className="w-6 h-6 text-primary" />
            Engineering Document Vault
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Central repository for CAD drawings, electrical single-line diagrams, FAT reports, and contracts
          </p>
        </div>
        {canUpload && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Register Document
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by document title, ID, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              const p = new URLSearchParams()
              if (search) p.set("search", search)
              if (e.target.value !== "all") p.set("category", e.target.value)
              router.push(`/documents?${p.toString()}`)
            }}
            className="px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring capitalize"
          >
            <option value="all">All Document Types</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>
      </div>

      {/* Documents Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Category</th>
                <th>Related Client</th>
                <th>Version</th>
                <th>File Size</th>
                <th>Registered Date</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <FileStack className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No engineering documents found matching your filter.
                  </td>
                </tr>
              ) : (
                documents.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/40 transition-colors">
                    <td>
                      <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>{d.fileName}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {d.businessId} {d.notes && `— ${d.notes}`}
                      </div>
                    </td>
                    <td>
                      <Badge variant="outline" className="capitalize text-xs">
                        {d.category.replace("_", " ")}
                      </Badge>
                    </td>
                    <td>
                      {d.company ? (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {d.company.name}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Internal</span>
                      )}
                    </td>
                    <td>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        v{d.version}.0
                      </Badge>
                    </td>
                    <td>
                      <span className="text-xs font-mono text-muted-foreground">
                        {(d.fileSize / 1024).toFixed(0)} KB
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground">{formatDate(d.createdAt)}</span>
                    </td>
                    <td className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileStack className="w-5 h-5 text-primary" />
              Register Technical Document
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label className="text-xs">Document Title / File Name *</Label>
              <Input
                placeholder="e.g. SLD-SUBSTATION-REV2.pdf"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label className="text-xs">Document Category *</Label>
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs">Link to Client Company</Label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Internal / All Companies</option>
                {options.companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs">Document Notes / Scope</Label>
              <Textarea
                rows={2}
                placeholder="Drawing revision details, approval stamps, notes..."
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
                Save Document
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
