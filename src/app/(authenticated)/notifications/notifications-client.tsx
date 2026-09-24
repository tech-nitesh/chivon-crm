"use client"

import React, { useState } from "react"
import { Bell, CheckCheck, Clock, Info, AlertTriangle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { markNotificationAsRead, markAllNotificationsAsRead } from "./actions"
import { useRouter } from "next/navigation"

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  entityType: string | null
  entityId: string | null
  isRead: boolean
  createdAt: string
}

interface NotificationsClientProps {
  initialNotifications: NotificationItem[]
}

export function NotificationsClient({ initialNotifications }: NotificationsClientProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [loading, setLoading] = useState(false)

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const displayed = filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
    router.refresh()
  }

  const handleMarkAll = async () => {
    setLoading(true)
    await markAllNotificationsAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm">
            System alerts, assignment updates, and workflow notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAll}
              disabled={loading}
              className="gap-1.5"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All as Read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-b border-border pb-3">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            filter === "unread"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-lg border border-border/60">
          <Bell className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold text-lg">No notifications</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
            {filter === "unread"
              ? "You have caught up on all pending notifications."
              : "You do not have any notifications in your inbox yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-lg border transition-all flex items-start justify-between gap-4 ${
                n.isRead
                  ? "bg-card/40 border-border/50 opacity-80"
                  : "bg-card border-primary/30 shadow-sm"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-full mt-0.5 ${
                    n.isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                  }`}
                >
                  <Bell className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{n.title}</span>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                    )}
                    <Badge variant="outline" className="text-[0.7rem] uppercase">
                      {n.type.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/70 pt-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {!n.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMarkAsRead(n.id)}
                  className="shrink-0 text-xs gap-1"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark read
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
