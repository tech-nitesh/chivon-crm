"use server"

import prisma from "@/lib/db"
import { requireAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function getNotifications() {
  const session = await requireAuth()
  if (!session?.user?.id) return []

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    entityType: n.entityType,
    entityId: n.entityId,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }))
}

export async function markNotificationAsRead(id: string) {
  const session = await requireAuth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  })

  revalidatePath("/notifications")
  return { success: true }
}

export async function markAllNotificationsAsRead() {
  const session = await requireAuth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized" }

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  })

  revalidatePath("/notifications")
  return { success: true }
}
