"use server"

import prisma from "@/lib/db"
import { requirePermission } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"
import bcrypt from "bcryptjs"

export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string }

// ----------------- USERS -----------------
export async function getUsers() {
  await requirePermission("admin.users.manage")
  const users = await prisma.user.findMany({
    include: {
      userRoles: { include: { role: { select: { id: true, name: true } } } },
      department: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return users.map((u) => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    role: u.userRoles[0]?.role || null,
    department: u.department,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
  }))
}

export async function createUser(input: {
  email: string
  password?: string
  firstName: string
  lastName: string
  phone?: string
  roleId: string
  departmentId?: string
}): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("admin.users.manage")

  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) return { success: false, error: "A user with this email already exists" }

  const passwordHash = await bcrypt.hash(input.password || "ChivonAdmin2024!", 10)

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      departmentId: input.departmentId || undefined,
      isActive: true,
      userRoles: {
        create: {
          roleId: input.roleId,
        },
      },
    },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "user",
    entityId: user.id,
    action: "create",
    after: { email: user.email, roleId: input.roleId },
  })

  return { success: true, data: { id: user.id } }
}

export async function toggleUserStatus(id: string, isActive: boolean): Promise<ActionResult> {
  const session = await requirePermission("admin.users.manage")
  await prisma.user.update({
    where: { id },
    data: { isActive },
  })
  return { success: true, data: null }
}

// ----------------- ROLES -----------------
export async function getRoles() {
  await requirePermission("admin.roles.manage")
  const roles = await prisma.role.findMany({
    include: {
      userRoles: { select: { userId: true } },
      rolePermissions: { include: { permission: { select: { slug: true } } } },
    },
    orderBy: { name: "asc" },
  })

  return roles.map((r) => {
    const permissions = r.rolePermissions.map((rp) => rp.permission.slug)

    return {
      id: r.id,
      name: r.name,
      description: r.description,
      permissions,
      isSystem: r.isSystem,
      usersCount: r.userRoles.length,
      createdAt: r.createdAt.toISOString(),
    }
  })
}

export async function createRole(input: {
  name: string
  description?: string
  permissions: string[]
}): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("admin.roles.manage")

  const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")

  const perms = await prisma.permission.findMany({
    where: { slug: { in: input.permissions } },
  })

  const role = await prisma.role.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      isSystem: false,
      rolePermissions: {
        create: perms.map((p) => ({
          permissionId: p.id,
        })),
      },
    },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "role",
    entityId: role.id,
    action: "create",
    after: { name: role.name },
  })

  return { success: true, data: { id: role.id } }
}

// ----------------- DEPARTMENTS -----------------
export async function getDepartments() {
  await requirePermission("admin.settings.manage")
  const depts = await prisma.department.findMany({
    include: {
      users: { select: { id: true, firstName: true, lastName: true } },
      services: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  })

  return depts.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.code,
    usersCount: d.users.length,
    servicesCount: d.services.length,
    createdAt: d.createdAt.toISOString(),
  }))
}

export async function createDepartment(input: {
  name: string
  description?: string
}): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("admin.settings.manage")

  const code = (input.description || input.name).slice(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, "")

  const dept = await prisma.department.create({
    data: {
      name: input.name,
      code: code || "DEPT",
    },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "department",
    entityId: dept.id,
    action: "create",
    after: { name: dept.name },
  })

  return { success: true, data: { id: dept.id } }
}

// ----------------- SERVICES -----------------
export async function getServices() {
  await requirePermission("admin.settings.manage")
  const services = await prisma.service.findMany({
    include: {
      department: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  })

  return services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    isActive: s.isActive,
    department: s.department,
  }))
}

export async function createService(input: {
  name: string
  description?: string
  departmentId?: string
}): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("admin.settings.manage")

  const service = await prisma.service.create({
    data: {
      name: input.name,
      description: input.description,
      departmentId: input.departmentId || undefined,
      isActive: true,
    },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "service",
    entityId: service.id,
    action: "create",
    after: { name: service.name },
  })

  return { success: true, data: { id: service.id } }
}

// ----------------- APPROVAL RULES -----------------
export async function getApprovalRules() {
  await requirePermission("admin.settings.manage")
  const rules = await prisma.approvalRule.findMany({
    orderBy: { priority: "desc" },
  })

  return rules.map((r) => ({
    id: r.id,
    name: r.name,
    entityType: r.entityType,
    condition: r.condition,
    approverId: r.approverId,
    approverRole: r.approverRole,
    priority: r.priority,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
  }))
}

export async function createApprovalRule(input: {
  name: string
  entityType: string
  condition: string
  approverId: string
  approverRole?: string
}): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("admin.settings.manage")

  const rule = await prisma.approvalRule.create({
    data: {
      name: input.name,
      entityType: input.entityType,
      condition: input.condition,
      approverId: input.approverId,
      approverRole: input.approverRole,
      isActive: true,
    },
  })

  return { success: true, data: { id: rule.id } }
}

// ----------------- AUDIT LOGS -----------------
export async function getAuditLogs(params?: { search?: string; entityType?: string }) {
  await requirePermission("admin.audit.view")
  const where: any = {}
  if (params?.entityType && params.entityType !== "all") where.entityType = params.entityType
  if (params?.search) {
    where.OR = [
      { action: { contains: params.search } },
      { entityId: { contains: params.search } },
      { user: { firstName: { contains: params.search } } },
      { user: { email: { contains: params.search } } },
    ]
  }

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return logs.map((l) => ({
    id: l.id,
    action: l.action,
    entityType: l.entityType,
    entityId: l.entityId,
    before: l.before,
    after: l.after,
    ipAddress: l.ipAddress,
    user: l.user ? `${l.user.firstName} ${l.user.lastName} (${l.user.email})` : "System",
    createdAt: l.createdAt.toISOString(),
  }))
}

// ----------------- ADMIN OPTIONS -----------------
export async function getAdminOptions() {
  await requirePermission("admin.users.manage")
  const [roles, departments, users] = await Promise.all([
    prisma.role.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: "asc" },
    }),
  ])
  return { roles, departments, users }
}
