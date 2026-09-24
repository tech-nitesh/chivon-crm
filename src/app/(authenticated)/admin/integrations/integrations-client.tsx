"use client"

import React, { useState } from "react"
import {
  Link2,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Sliders,
  DollarSign,
  MessageSquare,
  Mail,
  Database,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface IntegrationsClientProps {
  permissions: string[]
}

const INTEGRATIONS = [
  {
    id: "quickbooks",
    name: "QuickBooks Online",
    category: "Accounting & General Ledger",
    description: "Bi-directional sync of UAE VAT invoices, payments, chart of accounts, and client credit balances.",
    status: "connected",
    lastSync: "Today at 09:15 AM",
    syncRecords: "214 Invoices Synced",
  },
  {
    id: "zoho",
    name: "Zoho Books",
    category: "Accounting & Tax Filing",
    description: "Export itemized engineering bills, supplier purchase orders, and corporate bank feeds.",
    status: "available",
    lastSync: "Not connected",
    syncRecords: "—",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business API",
    category: "Customer Communication",
    description: "Send automated quotation alerts, site visit confirmations, and payment receipt receipts directly to clients.",
    status: "connected",
    lastSync: "Active Listener",
    syncRecords: "Webhooks Healthy",
  },
  {
    id: "microsoft",
    name: "Microsoft 365 / Outlook",
    category: "Email & Calendar",
    description: "Calendar scheduling for site audits, email conversation sync with contact records.",
    status: "connected",
    lastSync: "Live Stream",
    syncRecords: "OAuth 2.0 Token Valid",
  },
]

export function IntegrationsClient({ permissions }: IntegrationsClientProps) {
  const [syncingId, setSyncingId] = useState<string | null>(null)

  const handleSync = (id: string) => {
    setSyncingId(id)
    setTimeout(() => {
      setSyncingId(null)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Link2 className="w-6 h-6 text-primary" />
          Enterprise Integrations & API Connectors
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect ERP/accounting software, WhatsApp messaging, and Microsoft 365 cloud services
        </p>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTEGRATIONS.map((integ) => (
          <div key={integ.id} className="card p-5 space-y-4 flex flex-col justify-between hover:border-primary/40 transition-colors">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-foreground text-base">{integ.name}</h3>
                  <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">
                    {integ.category}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={
                    integ.status === "connected"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs"
                      : "bg-gray-500/10 text-gray-500 border-gray-500/20 text-xs"
                  }
                >
                  {integ.status === "connected" ? "Connected" : "Available"}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {integ.description}
              </p>
            </div>

            <div className="border-t border-border pt-3 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-muted-foreground block text-[11px]">Sync Status</span>
                <span className="font-mono text-foreground text-xs">{integ.syncRecords}</span>
              </div>

              {integ.status === "connected" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSync(integ.id)}
                  disabled={syncingId === integ.id}
                  className="gap-1.5 text-xs h-8"
                >
                  <RefreshCw className={`w-3 h-3 ${syncingId === integ.id ? "animate-spin" : ""}`} />
                  Sync Now
                </Button>
              ) : (
                <Button size="sm" className="text-xs h-8 gap-1">
                  Connect App
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
