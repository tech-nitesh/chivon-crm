"use client"

import React, { useState } from "react"
import {
  Shield,
  Plus,
  Users,
  CheckCircle2,
  Lock,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { hasPermission } from "@/lib/permissions"
import { createRole } from "../actions"
import { useRouter } from "next/navigation"

interface RoleItem {
  id: string
  name: string
  description: string | null
  permissions: string[]
  isSystem: boolean
  usersCount: number
  createdAt: string
}

interface RolesClientProps {
  roles: RoleItem[]
  permissions: string[]
}

const AVAILABLE_PERMISSIONS = [
  "inquiries.view",
  "inquiries.create",
  "inquiries.edit",
  "inquiries.qualify",
  "opportunities.view",
  "opportunities.create",
  "opportunities.edit",
  "customers.view",
  "customers.create",
  "customers.edit",
  "technical.view",
  "technical.edit",
  "quotations.view",
  "quotations.create",
  "quotations.edit",
  "quotations.approve",
  "invoices.view",
  "invoices.create",
  "invoices.edit",
  "expenses.view",
  "expenses.create",
  "expenses.approve",
  "projects.view",
  "projects.create",
  "projects.edit",
  "vendors.view",
  "vendors.create",
  "vendors.edit",
  "reports.view",
  "documents.view",
  "documents.create",
  "admin.users.manage",
  "admin.roles.manage",
  "admin.settings.manage",
  "admin.audit.view",
]

export function RolesClient({ roles, permissions }: RolesClientProps) {
  const router = useRouter()
  const canManage = hasPermission(permissions, "admin.roles.manage")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || selectedPerms.length === 0) {
      setError("Please specify role name and select at least one permission")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await createRole({
        name,
        description: description || undefined,
        permissions: selectedPerms,
      })
      if (res.success) {
        setIsDialogOpen(false)
        router.refresh()
      } else {
        setError(res.error || "Failed to create role")
      }
    } catch (err: any) {
      setError(err.message || "Failed to create role")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Roles & Granular Permissions (RBAC)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enforce least-privilege security matrix across sales, engineering, finance, and operations
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Define Custom Role
          </Button>
        )}
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((r) => (
          <div key={r.id} className="card p-5 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-base capitalize">{r.name}</h3>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {r.usersCount} users
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{r.description || "System RBAC Profile"}</p>

              <div className="mt-3 pt-3 border-t border-border">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Permissions ({r.permissions.length})
                </span>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  {r.permissions.slice(0, 12).map((p) => (
                    <Badge key={p} variant="secondary" className="text-[10px] font-mono py-0 px-1.5">
                      {p}
                    </Badge>
                  ))}
                  {r.permissions.length > 12 && (
                    <span className="text-[10px] text-muted-foreground font-mono self-center">
                      +{r.permissions.length - 12} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{r.isSystem ? "Built-in System Role" : "Custom Role"}</span>
              {r.isSystem && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
          </div>
        ))}
      </div>

      {/* Create Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Define Custom Role & Permissions
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label className="text-xs">Role Name *</Label>
              <Input
                placeholder="e.g. Estimation Specialist"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label className="text-xs">Description</Label>
              <Textarea
                rows={2}
                placeholder="Responsibilities and purpose of this role..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1.5 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Select Privileges *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-56 overflow-y-auto p-2 border border-input rounded-md">
                {AVAILABLE_PERMISSIONS.map((perm) => {
                  const checked = selectedPerms.includes(perm)
                  return (
                    <label key={perm} className="flex items-center gap-2 text-xs p-1 hover:bg-muted rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedPerms(
                            checked ? selectedPerms.filter((p) => p !== perm) : [...selectedPerms, perm]
                          )
                        }}
                      />
                      <span className="font-mono text-[11px]">{perm}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Role
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
