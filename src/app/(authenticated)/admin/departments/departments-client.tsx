"use client"

import React, { useState } from "react"
import {
  Building2,
  Plus,
  Users,
  Wrench,
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
import { createDepartment } from "../actions"
import { useRouter } from "next/navigation"

interface DepartmentItem {
  id: string
  name: string
  description: string | null
  usersCount: number
  servicesCount: number
  createdAt: string
}

interface DepartmentsClientProps {
  departments: DepartmentItem[]
  permissions: string[]
}

export function DepartmentsClient({ departments, permissions }: DepartmentsClientProps) {
  const router = useRouter()
  const canManage = hasPermission(permissions, "admin.settings.manage")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    setLoading(true)
    setError(null)
    try {
      const res = await createDepartment({ name, description: description || undefined })
      if (res.success) {
        setIsDialogOpen(false)
        router.refresh()
      } else {
        setError(res.error || "Failed to create department")
      }
    } catch (err: any) {
      setError(err.message || "Failed to create department")
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
            <Building2 className="w-6 h-6 text-primary" />
            Engineering Departments & Divisions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize technical divisions, engineering disciplines, and workshop units
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Department
          </Button>
        )}
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((d) => (
          <div key={d.id} className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-base">{d.name}</h3>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground min-h-[32px]">
              {d.description || "Operational division"}
            </p>

            <div className="border-t border-border pt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                <span>{d.usersCount} Staff</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Wrench className="w-3.5 h-3.5" />
                <span>{d.servicesCount} Services</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Create Engineering Department
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label className="text-xs">Department Name *</Label>
              <Input
                placeholder="e.g. Electrical & Instrumentation"
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
                placeholder="Core focus, engineering competencies..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1.5 text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Department
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
