"use client"

import React, { useState } from "react"
import {
  Landmark,
  Plus,
  Building2,
  DollarSign,
  Loader2,
  CheckCircle2,
  CreditCard,
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
import { formatCurrency, formatDate } from "@/lib/utils"
import { hasPermission } from "@/lib/permissions"
import { createBankAccount } from "../actions"
import { useRouter } from "next/navigation"

interface BankAccountItem {
  id: string
  name: string
  bankName: string
  accountNumber: string
  currency: string
  balance: number
  isActive: boolean
  syncStatus: string
  createdAt: Date
}

interface BankingClientProps {
  accounts: BankAccountItem[]
  permissions: string[]
}

export function BankingClient({ accounts, permissions }: BankingClientProps) {
  const router = useRouter()
  const canManage = hasPermission(permissions, "admin.settings.manage")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [bankName, setBankName] = useState("Emirates NBD")
  const [accountNumber, setAccountNumber] = useState("")
  const [currency, setCurrency] = useState("AED")
  const [balance, setBalance] = useState<number | string>("")

  const totalLiquidity = accounts.reduce((sum, a) => sum + a.balance, 0)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !accountNumber) {
      setError("Please fill required fields")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await createBankAccount({
        name,
        bankName,
        accountNumber,
        currency,
        balance: Number(balance) || 0,
      })
      if (res.success) {
        setIsDialogOpen(false)
        router.refresh()
      } else {
        setError(res.error || "Failed to add bank account")
      }
    } catch (err: any) {
      setError(err.message || "Failed to add bank account")
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
            <Landmark className="w-6 h-6 text-primary" />
            Treasury & Corporate Banking
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Corporate operational accounts, cash liquidity, and banking reconciliations
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Corporate Account
          </Button>
        )}
      </div>

      {/* Liquidity Strip */}
      <div className="card p-6 bg-gradient-to-r from-blue-900/20 via-background to-background border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Liquid Cash Position (All Accounts)
            </span>
            <div className="text-3xl font-extrabold font-mono text-foreground mt-1">
              {formatCurrency(totalLiquidity)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Consolidated cash balance available across operational accounts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold px-3 py-1">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Healthy Operating Buffer
            </Badge>
          </div>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.length === 0 ? (
          <div className="col-span-full card p-12 text-center text-muted-foreground">
            <Landmark className="w-10 h-10 mx-auto mb-2 opacity-50" />
            No corporate bank accounts configured yet.
          </div>
        ) : (
          accounts.map((acct) => (
            <div key={acct.id} className="card p-5 space-y-4 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground text-base">{acct.name}</h3>
                  <span className="text-xs text-muted-foreground">{acct.bankName}</span>
                </div>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>

              <div>
                <span className="text-xs text-muted-foreground">Available Balance</span>
                <div className="text-2xl font-bold font-mono text-foreground mt-0.5">
                  {acct.currency} {acct.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="border-t border-border pt-3 flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span>IBAN / Account:</span>
                <span className="font-semibold">{acct.accountNumber}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Bank Account Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-primary" />
              Connect Corporate Bank Account
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label className="text-xs">Account Label *</Label>
              <Input
                placeholder="e.g. Primary Operations Current Account"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label className="text-xs">Financial Institution / Bank *</Label>
              <Input
                placeholder="e.g. Emirates NBD, ADCB, FAB, Mashreq"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">IBAN / Account Number *</Label>
                <Input
                  placeholder="AE..."
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="mt-1.5 font-mono"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Currency</Label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="AED">AED (UAE Dirham)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Current Opening Balance</Label>
              <Input
                type="number"
                placeholder="e.g. 250000"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
