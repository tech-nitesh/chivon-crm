"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Building2,
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  User,
  Plus,
  Edit,
  Trash2,
  HelpCircle,
  TrendingUp,
  FolderKanban,
  FileText,
  Clock,
  Loader2,
  CheckCircle,
  AlertCircle,
  Star,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency, formatDate } from "@/lib/utils"
import { hasPermission } from "@/lib/permissions"
import { updateCompany, deleteCompany, createContact } from "../../actions"

interface CompanyDetailClientProps {
  company: any
  permissions: string[]
}

export function CompanyDetailClient({ company, permissions }: CompanyDetailClientProps) {
  const router = useRouter()
  const canEdit = hasPermission(permissions, "customers.edit")
  const canDelete = hasPermission(permissions, "customers.delete")
  const canCreate = hasPermission(permissions, "customers.create")

  const [activeTab, setActiveTab] = useState("overview")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: company.name || "",
    industry: company.industry || "",
    website: company.website || "",
    email: company.email || "",
    phone: company.phone || "",
    address: company.address || "",
    city: company.city || "",
    state: company.state || "",
    country: company.country || "",
    postalCode: company.postalCode || "",
    notes: company.notes || "",
  })

  // New Contact form state
  const [contactForm, setContactForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    mobile: "",
    designation: "",
    department: "",
    isPrimary: false,
    isDecisionMaker: false,
    notes: "",
  })

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await updateCompany(company.id, editForm)
      if (res.success) {
        setIsEditDialogOpen(false)
        router.refresh()
      } else {
        setError(res.error)
      }
    } catch (err: any) {
      setError(err.message || "Failed to update company")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCompany = async () => {
    if (!confirm(`Are you sure you want to delete ${company.name}? This will mark it inactive.`)) {
      return
    }
    setLoading(true)
    try {
      const res = await deleteCompany(company.id)
      if (res.success) {
        router.push("/customers/companies")
      } else {
        alert(res.error)
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete company")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await createContact({
        companyId: company.id,
        ...contactForm,
      })
      if (res.success) {
        setIsContactDialogOpen(false)
        setContactForm({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          mobile: "",
          designation: "",
          department: "",
          isPrimary: false,
          isDecisionMaker: false,
          notes: "",
        })
        router.refresh()
      } else {
        setError(res.error)
      }
    } catch (err: any) {
      setError(err.message || "Failed to create contact")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/customers/companies">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Companies
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
            {company.businessId}
          </span>
          <Badge variant={company.isActive ? "default" : "outline"} className={company.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}>
            {company.isActive ? "Active" : "Archived"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {canCreate && (
            <Button size="sm" onClick={() => setIsContactDialogOpen(true)} className="gap-1.5">
              <Plus className="w-4 h-4" />
              Add Contact
            </Button>
          )}
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)} className="gap-1.5">
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="outline" size="sm" onClick={handleDeleteCompany} className="gap-1.5 text-destructive hover:bg-destructive/10">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Header Card */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-2xl flex-shrink-0">
                {company.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{company.name}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                  {company.industry && (
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {company.industry}
                    </span>
                  )}
                  {(company.city || company.country) && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {[company.city, company.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {company.owner && (
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      Owner: {company.owner.firstName} {company.owner.lastName}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Added {formatDate(company.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-2 sm:gap-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
              <div className="text-center px-2">
                <div className="text-2xl font-bold text-foreground">{company.contacts?.length || 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Contacts</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center px-2">
                <div className="text-2xl font-bold text-foreground">{company.inquiries?.length || 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Inquiries</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center px-2">
                <div className="text-2xl font-bold text-foreground">{company.opportunities?.length || 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Deals</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center px-2">
                <div className="text-2xl font-bold text-foreground">{company.projects?.length || 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Projects</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({company.contacts?.length || 0})</TabsTrigger>
          <TabsTrigger value="inquiries">Inquiries ({company.inquiries?.length || 0})</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities ({company.opportunities?.length || 0})</TabsTrigger>
          <TabsTrigger value="projects">Projects ({company.projects?.length || 0})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({company.invoices?.length || 0})</TabsTrigger>
          <TabsTrigger value="activities">Activities ({company.activities?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Tab: Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground w-20">Email:</span>
                  {company.email ? (
                    <a href={`mailto:${company.email}`} className="text-primary hover:underline">
                      {company.email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground italic">Not specified</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground w-20">Phone:</span>
                  {company.phone ? (
                    <a href={`tel:${company.phone}`} className="text-foreground hover:underline">
                      {company.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground italic">Not specified</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground w-20">Website:</span>
                  {company.website ? (
                    <a href={company.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      {company.website}
                    </a>
                  ) : (
                    <span className="text-muted-foreground italic">Not specified</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">Location & Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    {company.address ? (
                      <div>{company.address}</div>
                    ) : (
                      <div className="text-muted-foreground italic">No street address</div>
                    )}
                    <div className="text-muted-foreground mt-1">
                      {[company.city, company.state, company.postalCode, company.country].filter(Boolean).join(", ") ||
                        "No city or country specified"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {company.notes && (
              <Card className="border-border md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Internal Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">{company.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab: Contacts */}
        <TabsContent value="contacts">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Key Personnel & Contacts</CardTitle>
              {canCreate && (
                <Button size="sm" onClick={() => setIsContactDialogOpen(true)} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Add Contact
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {company.contacts && company.contacts.length > 0 ? (
                <div className="divide-y divide-border">
                  {company.contacts.map((contact: any) => (
                    <div key={contact.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">
                            {contact.firstName} {contact.lastName}
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
                        <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-3">
                          {contact.designation && <span>{contact.designation}</span>}
                          {contact.department && <span>• {contact.department}</span>}
                          {contact.email && (
                            <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                              {contact.email}
                            </a>
                          )}
                          {(contact.phone || contact.mobile) && (
                            <span>{contact.phone || contact.mobile}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-muted-foreground">{contact.businessId}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No contacts found for this company. Add one above.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Inquiries */}
        <TabsContent value="inquiries">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Inquiries & Leads</CardTitle>
              <Link href={`/sales/inquiries/new?companyId=${company.id}`}>
                <Button size="sm" className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  New Inquiry
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {company.inquiries && company.inquiries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">Scope / Discipline</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Priority</th>
                        <th className="py-2.5 px-3">Salesperson</th>
                        <th className="py-2.5 px-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {company.inquiries.map((inq: any) => (
                        <tr key={inq.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-medium text-xs text-primary">
                            <Link href={`/sales/inquiries/${inq.id}`} className="hover:underline">
                              {inq.businessId}
                            </Link>
                          </td>
                          <td className="py-2.5 px-3 max-w-[280px] truncate">{inq.scope}</td>
                          <td className="py-2.5 px-3">
                            <Badge variant="outline" className="capitalize text-xs font-normal">
                              {inq.status.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="capitalize text-xs">{inq.priority}</span>
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground text-xs">
                            {inq.salesperson ? `${inq.salesperson.firstName} ${inq.salesperson.lastName}` : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground text-xs">{formatDate(inq.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No inquiries recorded yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Opportunities */}
        <TabsContent value="opportunities">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Opportunities & Pipeline</CardTitle>
              <Link href={`/sales/opportunities/new?companyId=${company.id}`}>
                <Button size="sm" className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  New Opportunity
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {company.opportunities && company.opportunities.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">Title</th>
                        <th className="py-2.5 px-3">Stage</th>
                        <th className="py-2.5 px-3">Estimated Value</th>
                        <th className="py-2.5 px-3">Probability</th>
                        <th className="py-2.5 px-3">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {company.opportunities.map((opp: any) => (
                        <tr key={opp.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-medium text-xs text-primary">
                            <Link href={`/sales/opportunities/${opp.id}`} className="hover:underline">
                              {opp.businessId}
                            </Link>
                          </td>
                          <td className="py-2.5 px-3 font-medium">{opp.title}</td>
                          <td className="py-2.5 px-3">
                            <Badge variant="outline" className="capitalize text-xs font-normal">
                              {opp.stage.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium">
                            {formatCurrency(opp.estimatedValue || 0)}
                          </td>
                          <td className="py-2.5 px-3">{opp.probability}%</td>
                          <td className="py-2.5 px-3 text-muted-foreground text-xs">{formatDate(opp.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No opportunities in pipeline for this company.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Projects */}
        <TabsContent value="projects">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Executed & Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {company.projects && company.projects.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">Title</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Contract Value</th>
                        <th className="py-2.5 px-3">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {company.projects.map((prj: any) => (
                        <tr key={prj.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-medium text-xs text-primary">
                            <Link href={`/projects/${prj.id}`} className="hover:underline">
                              {prj.businessId}
                            </Link>
                          </td>
                          <td className="py-2.5 px-3 font-medium">{prj.title}</td>
                          <td className="py-2.5 px-3">
                            <Badge variant="outline" className="capitalize text-xs font-normal">
                              {prj.status}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium">
                            {formatCurrency(prj.contractValue || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground text-xs">{formatDate(prj.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No projects found for this company.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Invoices */}
        <TabsContent value="invoices">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {company.invoices && company.invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
                        <th className="py-2.5 px-3">Invoice #</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {company.invoices.map((inv: any) => (
                        <tr key={inv.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-medium text-xs text-primary">
                            {inv.businessId}
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge variant="outline" className="capitalize text-xs font-normal">
                              {inv.status}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground text-xs">{formatDate(inv.invoiceDate)}</td>
                          <td className="py-2.5 px-3 font-mono font-medium">
                            {formatCurrency(inv.total || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No invoices recorded yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Activities */}
        <TabsContent value="activities">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Interaction & Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              {company.activities && company.activities.length > 0 ? (
                <div className="space-y-4">
                  {company.activities.map((act: any) => (
                    <div key={act.id} className="flex items-start gap-3 border-l-2 border-primary/40 pl-3 py-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm capitalize">{act.type}:</span>
                          <span className="text-sm font-medium text-foreground">{act.subject}</span>
                          <span className="text-xs text-muted-foreground">• {formatDate(act.createdAt)}</span>
                        </div>
                        {act.description && (
                          <p className="text-xs text-muted-foreground mt-1">{act.description}</p>
                        )}
                        {act.user && (
                          <div className="text-[11px] text-muted-foreground mt-1">
                            Logged by: {act.user.firstName} {act.user.lastName}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No activity logged yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Company Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Company Details</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateCompany} className="space-y-4 mt-2">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={editForm.industry}
                  onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={editForm.country}
                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Contact Person</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateContact} className="space-y-4 mt-2">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={contactForm.firstName}
                  onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={contactForm.lastName}
                  onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cEmail">Email</Label>
                <Input
                  id="cEmail"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cPhone">Phone / Mobile</Label>
                <Input
                  id="cPhone"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  placeholder="e.g. Procurement Director"
                  value={contactForm.designation}
                  onChange={(e) => setContactForm({ ...contactForm, designation: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="e.g. Commercial"
                  value={contactForm.department}
                  onChange={(e) => setContactForm({ ...contactForm, department: e.target.value })}
                />
              </div>
              <div className="col-span-2 flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contactForm.isPrimary}
                    onChange={(e) => setContactForm({ ...contactForm, isPrimary: e.target.checked })}
                    className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Set as primary contact</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contactForm.isDecisionMaker}
                    onChange={(e) => setContactForm({ ...contactForm, isDecisionMaker: e.target.checked })}
                    className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Decision maker</span>
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsContactDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Contact
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
