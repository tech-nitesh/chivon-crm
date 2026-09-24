"use client"

import React from "react"
import Link from "next/link"
import {
  Building2,
  TrendingUp,
  Target,
  FolderKanban,
  DollarSign,
  Phone,
  Clock,
  AlertCircle,
  ArrowRight,
  Users,
  FileText,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"

interface DashboardData {
  stats: {
    totalCompanies: number
    totalInquiries: number
    openOpportunities: number
    activeProjects: number
    totalInvoices: number
    pendingFollowUps: number
    receivables: number
    wonThisMonth: number
  }
  pipeline: Array<{ stage: string; count: number; value: number }>
  recentInquiries: Array<{
    id: string
    businessId: string
    company: string
    source: string
    status: string
    priority: string
    createdAt: string
    salesperson: string | null
  }>
  recentActivities: Array<{
    id: string
    type: string
    subject: string
    user: string
    company: string | null
    createdAt: string
  }>
  userRoles: string[]
}

const statCards = [
  { key: "totalCompanies", label: "Total Customers", icon: Building2, href: "/customers/companies", color: "text-primary" },
  { key: "totalInquiries", label: "Total Inquiries", icon: Phone, href: "/sales/inquiries", color: "text-info" },
  { key: "openOpportunities", label: "Open Opportunities", icon: Target, href: "/sales/opportunities", color: "text-warning" },
  { key: "activeProjects", label: "Active Projects", icon: FolderKanban, href: "/projects", color: "text-success" },
  { key: "pendingFollowUps", label: "Pending Follow-ups", icon: Clock, href: "/sales/follow-ups", color: "text-accent" },
  { key: "wonThisMonth", label: "Won This Month", icon: TrendingUp, href: "/sales/opportunities?stage=won", color: "text-success" },
] as const

const stageLabels: Record<string, string> = {
  qualified: "Qualified",
  technical: "Technical",
  site_visit: "Site Visit",
  quotation: "Quotation",
  negotiation: "Negotiation",
  awaiting_po: "Awaiting PO",
}

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  meeting: Users,
  email: FileText,
  note: FileText,
}

export function DashboardClient({ data, userName }: { data: DashboardData; userName: string }) {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {userName}</h1>
          <p className="page-description">
            Here&apos;s what&apos;s happening across your business today.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon
          const value = data.stats[card.key]
          return (
            <Link key={card.key} href={card.href}>
              <div className="stat-card cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <span className="stat-card-label">{card.label}</span>
                  <Icon className={`w-4 h-4 ${card.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                </div>
                <div className="stat-card-value">
                  {typeof value === "number" ? value.toLocaleString() : value}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Receivables Card */}
      {data.stats.receivables > 0 && (
        <Link href="/accounting/receivables">
          <Card className="mb-6 border-warning/30 bg-warning-light/30 cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-warning" />
                <div>
                  <div className="text-sm font-medium">Outstanding Receivables</div>
                  <div className="text-2xl font-bold text-warning">
                    {formatCurrency(data.stats.receivables)}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pipeline */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Sales Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.pipeline.length === 0 ? (
              <div className="empty-state py-6">
                <Target className="empty-state-icon mx-auto" />
                <p className="empty-state-title">No opportunities yet</p>
                <p className="empty-state-text">
                  Create your first opportunity to see pipeline data.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.pipeline.map((stage) => (
                  <Link
                    key={stage.stage}
                    href={`/sales/opportunities?stage=${stage.stage}`}
                    className="flex items-center justify-between py-2 hover:bg-secondary rounded px-2 -mx-2 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {stageLabels[stage.stage] || stage.stage}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stage.count} {stage.count === 1 ? "deal" : "deals"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {formatCurrency(stage.value)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Inquiries */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                Recent Inquiries
              </CardTitle>
              <Link href="/sales/inquiries" className="text-xs text-primary hover:underline">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentInquiries.length === 0 ? (
              <div className="empty-state py-6">
                <Phone className="empty-state-icon mx-auto" />
                <p className="empty-state-title">No inquiries yet</p>
                <p className="empty-state-text">
                  Inquiries will appear here as they come in.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentInquiries.map((inquiry) => (
                  <Link
                    key={inquiry.id}
                    href={`/sales/inquiries/${inquiry.id}`}
                    className="block py-2 hover:bg-secondary rounded px-2 -mx-2 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {inquiry.company}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {inquiry.businessId} · {inquiry.source}
                        </div>
                      </div>
                      <StatusBadge status={inquiry.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Recent Activity
              </CardTitle>
              <Link href="/sales/activities" className="text-xs text-primary hover:underline">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentActivities.length === 0 ? (
              <div className="empty-state py-6">
                <Clock className="empty-state-icon mx-auto" />
                <p className="empty-state-title">No activity yet</p>
                <p className="empty-state-text">
                  Activities will appear here as your team works.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentActivities.map((activity) => {
                  const Icon = activityIcons[activity.type] || FileText
                  return (
                    <div key={activity.id} className="flex items-start gap-3 py-2">
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{activity.subject}</div>
                        <div className="text-xs text-muted-foreground">
                          {activity.user}
                          {activity.company && ` · ${activity.company}`}
                          {" · "}
                          {formatDate(activity.createdAt)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
