"use client"

import React, { useState } from "react"
import {
  ShieldAlert,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  DollarSign,
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
import { hasPermission } from "@/lib/permissions"
import { createApprovalRule } from "../actions"
import { useRouter } from "next/navigation"

interface RuleItem {
  id: string
  name: string
  entityType: string
  condition: string
  approverId: string
  approverRole: string | null
  priority: number
  isActive: boolean
  createdAt: string
}

interface ApprovalRulesClientProps {
  rules: RuleItem[]
  options: {
    users: { id: string; firstName: string; lastName: string }[]
    roles: { id: string; name: string }[]
  }
  permissions: string[]
}

export function ApprovalRulesClient({ rules, options, permissions }: ApprovalRulesClientProps) {
  const router = useRouter()
  const canManage = hasPermission(permissions, "admin.settings.manage")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [entityType, setEntityType] = useState("quotation")
  const [field, setField] = useState("grandTotal")
  const [operator, setOperator] = useState(">")
  const [value, setValue] = useState("100000")
  const [approverId, setApproverId] = useState(options.users[0]?.id || "")
  const [approverRole, setApproverRole] = useState("Sales Manager")

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !approverId) return
    setLoading(true)
    setError(null)
    try {
      const condition = JSON.stringify({ field, operator, value: Number(value) || value })
      const res = await createApprovalRule({
        name,
        entityType,
        condition,
        approverId,
        approverRole,
      })
      if (res.success) {
        setIsDialogOpen(false)
        router.refresh()
      } else {
        setError(res.error || "Failed to create rule")
      }
    } catch (err: any) {
      setError(err.message || "Failed to create rule")
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
            <ShieldAlert className="w-6 h-6 text-primary" />
            Approval Thresholds & Governance Matrix
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure automated multi-step signoffs, commercial discount ceilings, and spending floors
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Governance Rule
          </Button>
        )}
      </div>

      {/* Rules Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rule Name</th>
                <th>Target Workflow</th>
                <th>Trigger Condition</th>
                <th>Designated Approver</th>
                <th>Governance Tier</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No custom approval rules defined yet.
                  </td>
                </tr>
              ) : (
                rules.map((r) => {
                  let condDisplay = r.condition
                  try {
                    const parsed = JSON.parse(r.condition)
                    condDisplay = `When ${parsed.field} ${parsed.operator} ${parsed.value}`
                  } catch {}

                  return (
                    <tr key={r.id} className="hover:bg-muted/40 transition-colors">
                      <td>
                        <span className="font-semibold text-foreground text-sm">{r.name}</span>
                      </td>
                      <td>
                        <Badge variant="outline" className="capitalize text-xs font-mono">
                          {r.entityType.replace("_", " ")}
                        </Badge>
                      </td>
                      <td>
                        <span className="font-mono text-xs font-medium text-foreground bg-muted/60 px-2 py-1 rounded">
                          {condDisplay}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs font-medium text-primary">
                          {r.approverRole || "Designated Approver"}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-muted-foreground">Priority Tier {r.priority}</span>
                      </td>
                      <td>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                          Active Rule
                        </Badge>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              Configure Approval Rule
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label className="text-xs">Rule Policy Name *</Label>
              <Input
                placeholder="e.g. Quotation Bid > 100k AED Threshold"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Entity / Workflow</Label>
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="quotation">Quotation / Bid</option>
                  <option value="purchase_request">Purchase Requisition</option>
                  <option value="discount">Price Discount</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Condition Field</Label>
                <select
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono text-xs"
                >
                  <option value="grandTotal">grandTotal</option>
                  <option value="discountPercent">discountPercent</option>
                  <option value="marginPercent">marginPercent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Operator</Label>
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono text-xs"
                >
                  <option value=">">Greater than (&gt;)</option>
                  <option value=">=">Greater or equal (&gt;=)</option>
                  <option value="<">Less than (&lt;)</option>
                  <option value="=">Equals (=)</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Threshold Value</Label>
                <Input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="mt-1.5 font-mono"
                  placeholder="e.g. 100000"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Approver User</Label>
                <select
                  value={approverId}
                  onChange={(e) => setApproverId(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {options.users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Role Label</Label>
                <Input
                  value={approverRole}
                  onChange={(e) => setApproverRole(e.target.value)}
                  className="mt-1.5"
                  placeholder="e.g. Director"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Activate Rule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
