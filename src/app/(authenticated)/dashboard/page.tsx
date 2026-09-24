import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/db"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = session.user

  // Fetch real dashboard data
  const [
    totalCompanies,
    totalInquiries,
    openOpportunities,
    activeProjects,
    totalInvoices,
    pendingFollowUps,
    recentInquiries,
    recentActivities,
  ] = await Promise.all([
    prisma.company.count({ where: { isActive: true } }),
    prisma.inquiry.count(),
    prisma.opportunity.count({ where: { stage: { notIn: ["won", "lost"] } } }),
    prisma.project.count({ where: { status: "active" } }),
    prisma.financeInvoice.count(),
    prisma.followUp.count({ where: { status: "pending" } }),
    prisma.inquiry.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { company: true, salesperson: true },
    }),
    prisma.activity.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: true, company: true },
    }),
  ])

  // Pipeline data
  const pipelineStages = await prisma.opportunity.groupBy({
    by: ["stage"],
    _count: { id: true },
    _sum: { estimatedValue: true },
  })

  // Receivables
  const receivables = await prisma.financeInvoice.aggregate({
    where: { status: { in: ["sent", "partially_paid", "overdue"] } },
    _sum: { outstanding: true },
  })

  // Won this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  const wonThisMonth = await prisma.opportunity.count({
    where: {
      stage: "won",
      updatedAt: { gte: startOfMonth },
    },
  })

  const dashboardData = {
    stats: {
      totalCompanies,
      totalInquiries,
      openOpportunities,
      activeProjects,
      totalInvoices,
      pendingFollowUps,
      receivables: receivables._sum.outstanding || 0,
      wonThisMonth,
    },
    pipeline: pipelineStages.map((s) => ({
      stage: s.stage,
      count: s._count.id,
      value: s._sum.estimatedValue || 0,
    })),
    recentInquiries: recentInquiries.map((i) => ({
      id: i.id,
      businessId: i.businessId,
      company: i.company.name,
      source: i.source,
      status: i.status,
      priority: i.priority,
      createdAt: i.createdAt.toISOString(),
      salesperson: i.salesperson ? `${i.salesperson.firstName} ${i.salesperson.lastName}` : null,
    })),
    recentActivities: recentActivities.map((a) => ({
      id: a.id,
      type: a.type,
      subject: a.subject,
      user: `${a.user.firstName} ${a.user.lastName}`,
      company: a.company?.name || null,
      createdAt: a.createdAt.toISOString(),
    })),
    userRoles: user.roles,
  }

  return <DashboardClient data={dashboardData} userName={user.firstName} />
}
