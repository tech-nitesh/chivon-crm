"use server"

import prisma from "@/lib/db"
import { requirePermission } from "@/lib/permissions"

export async function getSalesReport() {
  await requirePermission("reports.view")

  const [inquiries, opportunities, wonOpps] = await Promise.all([
    prisma.inquiry.findMany({ select: { id: true, status: true, estimatedValue: true, source: true } }),
    prisma.opportunity.findMany({
      include: { company: { select: { name: true } } },
    }),
    prisma.opportunity.findMany({
      where: { stage: "won" },
      select: { estimatedValue: true },
    }),
  ])

  const totalPipeline = opportunities.reduce((sum, o) => sum + (o.estimatedValue || 0), 0)
  const weightedPipeline = opportunities.reduce((sum, o) => sum + (((o.estimatedValue || 0) * (o.probability || 0)) / 100), 0)
  const totalWon = wonOpps.reduce((sum, o) => sum + (o.estimatedValue || 0), 0)
  const winRate = opportunities.length > 0 ? (wonOpps.length / opportunities.length) * 100 : 0

  // Stage distribution
  const stageCounts: Record<string, { count: number; value: number }> = {}
  opportunities.forEach((o) => {
    if (!stageCounts[o.stage]) stageCounts[o.stage] = { count: 0, value: 0 }
    stageCounts[o.stage].count += 1
    stageCounts[o.stage].value += o.estimatedValue || 0
  })

  return {
    totalPipeline,
    weightedPipeline,
    totalWon,
    winRate,
    inquiriesCount: inquiries.length,
    opportunitiesCount: opportunities.length,
    wonCount: wonOpps.length,
    stageCounts,
  }
}

export async function getFinanceReport() {
  await requirePermission("reports.view")

  const [invoices, expenses, payments] = await Promise.all([
    prisma.financeInvoice.findMany({ select: { total: true, taxAmount: true, paidAmount: true, outstanding: true, status: true } }),
    prisma.financeExpense.findMany({ select: { amount: true, category: true } }),
    prisma.financePayment.findMany({ select: { amount: true, paymentDate: true } }),
  ])

  const totalInvoiced = invoices.reduce((sum, i) => sum + i.total, 0)
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalOutstanding = invoices.reduce((sum, i) => sum + i.outstanding, 0)
  const netOperatingProfit = totalInvoiced - totalExpenses

  // Expenses by category
  const expenseByCategory: Record<string, number> = {}
  expenses.forEach((e) => {
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount
  })

  return {
    totalInvoiced,
    totalCollected,
    totalExpenses,
    totalOutstanding,
    netOperatingProfit,
    expenseByCategory,
  }
}

export async function getProjectsReport() {
  await requirePermission("reports.view")

  const projects = await prisma.project.findMany({
    include: {
      company: { select: { name: true } },
      tasks: { select: { status: true } },
    },
  })

  const totalContract = projects.reduce((sum, p) => sum + p.contractValue, 0)
  const stageCounts: Record<string, number> = {}
  let totalTasks = 0
  let doneTasks = 0

  projects.forEach((p) => {
    stageCounts[p.stage] = (stageCounts[p.stage] || 0) + 1
    p.tasks.forEach((t) => {
      totalTasks += 1
      if (t.status === "done") doneTasks += 1
    })
  })

  const overallProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  return {
    projectsCount: projects.length,
    totalContract,
    stageCounts,
    overallProgress,
    projects: projects.map((p) => ({
      id: p.id,
      businessId: p.businessId,
      title: p.title,
      company: p.company.name,
      contractValue: p.contractValue,
      stage: p.stage,
      status: p.status,
    })),
  }
}

export async function getServicesReport() {
  await requirePermission("reports.view")

  const [inquiries, opportunities] = await Promise.all([
    prisma.inquiry.findMany({ select: { discipline: true, estimatedValue: true } }),
    prisma.opportunity.findMany({ select: { title: true, estimatedValue: true } }),
  ])

  const disciplineBreakdown: Record<string, { count: number; value: number }> = {}
  inquiries.forEach((inq) => {
    const disc = inq.discipline || "General Industrial"
    if (!disciplineBreakdown[disc]) disciplineBreakdown[disc] = { count: 0, value: 0 }
    disciplineBreakdown[disc].count += 1
    disciplineBreakdown[disc].value += inq.estimatedValue || 0
  })

  return {
    disciplineBreakdown,
  }
}
