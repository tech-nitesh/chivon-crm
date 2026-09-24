"use server"

import prisma from "@/lib/db"
import { requirePermission } from "@/lib/permissions"
import { generateBusinessId } from "@/lib/id-generator"
import { createAuditLog } from "@/lib/audit"

export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function getDocuments(params?: { search?: string; category?: string }) {
  await requirePermission("documents.view")
  const where: any = {}
  if (params?.category && params.category !== "all") where.category = params.category
  if (params?.search) {
    where.OR = [
      { fileName: { contains: params.search } },
      { notes: { contains: params.search } },
    ]
  }

  const docs = await prisma.document.findMany({
    where,
    include: {
      company: { select: { id: true, name: true, businessId: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return docs.map((d) => ({
    id: d.id,
    businessId: `DOC-${d.id.slice(-6).toUpperCase()}`,
    fileName: d.fileName,
    fileType: d.fileType,
    fileSize: d.fileSize,
    filePath: d.filePath,
    category: d.category,
    version: d.version,
    notes: d.notes,
    company: d.company,
    createdAt: d.createdAt.toISOString(),
  }))
}

export async function uploadDocumentRecord(input: {
  fileName: string
  fileType: string
  fileSize: number
  category: string
  filePath?: string
  companyId?: string
  notes?: string
}): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("documents.create")

  const doc = await prisma.document.create({
    data: {
      fileName: input.fileName,
      fileType: input.fileType || "application/pdf",
      fileSize: input.fileSize || 1024 * 250,
      filePath: input.filePath || `/uploads/${input.fileName}`,
      category: input.category,
      notes: input.notes,
      companyId: input.companyId || undefined,
      uploaderId: session.user.id,
    },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "document",
    entityId: doc.id,
    action: "create",
    after: { id: doc.id, fileName: doc.fileName, category: doc.category },
  })

  return { success: true, data: { id: doc.id } }
}

export async function getDocumentOptions() {
  await requirePermission("documents.view")
  const companies = await prisma.company.findMany({
    where: { isActive: true },
    select: { id: true, name: true, businessId: true },
    orderBy: { name: "asc" },
  })
  return { companies }
}
