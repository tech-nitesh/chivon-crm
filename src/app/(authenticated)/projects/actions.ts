"use server"

import prisma from "@/lib/db"
import { requirePermission } from "@/lib/permissions"
import { generateBusinessId } from "@/lib/id-generator"
import { createAuditLog } from "@/lib/audit"

export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function getProjects(params?: { search?: string; stage?: string }) {
  await requirePermission("projects.view")
  const where: any = {}
  if (params?.stage && params.stage !== "all") where.stage = params.stage
  if (params?.search) {
    where.OR = [
      { businessId: { contains: params.search } },
      { title: { contains: params.search } },
      { company: { name: { contains: params.search } } },
    ]
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      company: { select: { id: true, name: true, businessId: true } },
      manager: { select: { id: true, firstName: true, lastName: true } },
      purchaseOrder: { select: { id: true, businessId: true, poNumber: true } },
      tasks: { select: { id: true, status: true } },
      milestones: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return projects.map((p) => {
    const totalTasks = p.tasks.length
    const doneTasks = p.tasks.filter((t) => t.status === "done").length
    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

    return {
      id: p.id,
      businessId: p.businessId,
      title: p.title,
      description: p.description,
      company: p.company,
      manager: p.manager ? `${p.manager.firstName} ${p.manager.lastName}` : "Unassigned",
      contractValue: p.contractValue,
      stage: p.stage,
      priority: p.priority,
      status: p.status,
      startDate: p.startDate?.toISOString() || null,
      endDate: p.endDate?.toISOString() || null,
      progress,
      tasksCount: totalTasks,
      milestonesCount: p.milestones.length,
      createdAt: p.createdAt.toISOString(),
    }
  })
}

export async function createProject(input: {
  companyId: string
  title: string
  contractValue: number
  managerId?: string
  priority?: string
  startDate?: string
  endDate?: string
  description?: string
}): Promise<ActionResult<{ id: string; businessId: string }>> {
  const session = await requirePermission("projects.create")
  const businessId = await generateBusinessId("project")

  const project = await prisma.project.create({
    data: {
      businessId,
      companyId: input.companyId,
      title: input.title,
      contractValue: Number(input.contractValue) || 0,
      managerId: input.managerId || undefined,
      priority: input.priority || "medium",
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      description: input.description,
      stage: "po_received",
      status: "active",
      tasks: {
        create: [
          { title: "Kickoff Meeting & Engineering Review", priority: "high", status: "todo", sortOrder: 0 },
          { title: "Drawings & Schematics Approval", priority: "high", status: "todo", sortOrder: 1 },
          { title: "BOM Procurement & Material Receipt", priority: "medium", status: "todo", sortOrder: 2 },
          { title: "Assembly & Workshop Testing (FAT)", priority: "medium", status: "todo", sortOrder: 3 },
          { title: "On-site Installation & Commissioning (SAT)", priority: "high", status: "todo", sortOrder: 4 },
        ],
      },
    },
    include: { company: true },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "project",
    entityId: project.id,
    action: "create",
    after: { businessId: project.businessId, title: project.title, company: project.company.name },
  })

  return { success: true, data: { id: project.id, businessId: project.businessId } }
}

export async function updateProjectStage(id: string, stage: string): Promise<ActionResult> {
  const session = await requirePermission("projects.edit")
  const existing = await prisma.project.findUnique({ where: { id } })
  if (!existing) return { success: false, error: "Project not found" }

  const updated = await prisma.project.update({
    where: { id },
    data: { stage },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "project",
    entityId: id,
    action: "status_change",
    before: { stage: existing.stage },
    after: { stage: updated.stage },
  })

  return { success: true, data: null }
}

export async function getProjectOptions() {
  await requirePermission("projects.view")
  const [companies, managers] = await Promise.all([
    prisma.company.findMany({
      where: { isActive: true },
      select: { id: true, name: true, businessId: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
  ])
  return { companies, managers }
}
