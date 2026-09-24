"use client"

import React from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading CHIVON CRM...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    redirect("/login")
    return null
  }

  const user = session.user

  return (
    <div className="flex min-h-screen">
      <Sidebar permissions={user.permissions} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          user={{
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email || "",
            roles: user.roles,
          }}
        />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
