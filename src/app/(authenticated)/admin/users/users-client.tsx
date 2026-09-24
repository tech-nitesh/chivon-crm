"use client"

import React, { useState } from "react"
import {
  Users,
  Plus,
  Mail,
  Phone,
  Shield,
  Building2,
  Calendar,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/utils"
import { hasPermission } from "@/lib/permissions"
import { createUser, toggleUserStatus } from "../actions"
import { useRouter } from "next/navigation"

interface UserItem {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: { id: string; name: string }
  department: { id: string; name: string } | null
  isActive: boolean
  createdAt: string
}

interface UsersClientProps {
  users: UserItem[]
  options: {
    roles: { id: string; name: string }[]
    departments: { id: string; name: string }[]
  }
  permissions: string[]
}

export function UsersClient({ users, options, permissions }: UsersClientProps) {
  const router = useRouter()
  const canManage = hasPermission(permissions, "admin.users.manage")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("ChivonAdmin2024!")
  const [phone, setPhone] = useState("")
  const [roleId, setRoleId] = useState(options.roles[0]?.id || "")
  const [departmentId, setDepartmentId] = useState("")

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggleUserStatus(id, !current)
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !firstName || !lastName || !roleId) {
      setError("Please fill required fields")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await createUser({
        email,
        password,
        firstName,
        lastName,
        phone: phone || undefined,
        roleId,
        departmentId: departmentId || undefined,
      })
      if (res.success) {
        setIsDialogOpen(false)
        router.refresh()
      } else {
        setError(res.error || "Failed to create user")
      }
    } catch (err: any) {
      setError(err.message || "Failed to create user")
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
            <Users className="w-6 h-6 text-primary" />
            User Management & System Access
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Provision company staff, configure role memberships, and enforce access controls
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Staff Member
          </Button>
        )}
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Email Address</th>
                <th>Assigned Role</th>
                <th>Department</th>
                <th>Created</th>
                <th>Account Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/40 transition-colors">
                  <td>
                    <div className="font-semibold text-foreground text-sm">
                      {u.firstName} {u.lastName}
                    </div>
                    {u.phone && (
                      <div className="text-xs text-muted-foreground mt-0.5">{u.phone}</div>
                    )}
                  </td>
                  <td>
                    <div className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {u.email}
                    </div>
                  </td>
                  <td>
                    <Badge variant="outline" className="capitalize text-xs font-medium bg-primary/10 text-primary border-primary/20">
                      {u.role.name}
                    </Badge>
                  </td>
                  <td>
                    <span className="text-xs text-muted-foreground">
                      {u.department ? u.department.name : "Company Wide"}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</span>
                  </td>
                  <td>
                    <button
                      onClick={() => canManage && handleToggle(u.id, u.isActive)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                        u.isActive
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                      }`}
                    >
                      {u.isActive ? "Active" : "Suspended"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Provision New Staff User
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">First Name *</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Last Name *</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Corporate Email *</Label>
              <Input
                type="email"
                placeholder="name@chivon.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Role *</Label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring capitalize"
                  required
                >
                  {options.roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Department</Label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Company Wide</option>
                  {options.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Temporary Password</Label>
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 font-mono"
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Provision User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
