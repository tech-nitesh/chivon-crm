"use client"

import React, { useState } from "react"
import {
  Zap,
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  Settings,
  Bell,
  Sliders,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface AutomationClientProps {
  permissions: string[]
}

const AUTOMATIONS = [
  {
    id: "auto-1",
    name: "Lead Routing by Engineering Discipline",
    trigger: "New Inquiry Created",
    action: "Auto-assign technical lead based on discipline (Automation / Mechanical)",
    status: "active",
    executions: 142,
    lastRun: "24 mins ago",
  },
  {
    id: "auto-2",
    name: "Project Auto-Kickoff on PO Receipt",
    trigger: "Client PO Logged & Validated",
    action: "Instantiate Turnkey Project, assign PM, and seed standard stage tasks",
    status: "active",
    executions: 38,
    lastRun: "2 hours ago",
  },
  {
    id: "auto-3",
    name: "Payment Balance Auto-Reconciliation",
    trigger: "Remittance Logged against Invoice",
    action: "Recompute outstanding balance, transition invoice to Paid when zero balance",
    status: "active",
    executions: 89,
    lastRun: "Yesterday",
  },
  {
    id: "auto-4",
    name: "Quotation Validity Expiry Watcher",
    trigger: "Quotation Age > Validity Days",
    action: "Mark status as expired and alert account manager to request extension",
    status: "active",
    executions: 512,
    lastRun: "Today at 00:00",
  },
]

export function AutomationClient({ permissions }: AutomationClientProps) {
  const [activeItems, setActiveItems] = useState<Record<string, boolean>>({
    "auto-1": true,
    "auto-2": true,
    "auto-3": true,
    "auto-4": true,
  })

  const toggleAuto = (id: string) => {
    setActiveItems((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          Workflow Automation Engine
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Event-driven business rules, automated lead routing, and cross-departmental triggers
        </p>
      </div>

      {/* Automations List */}
      <div className="space-y-4">
        {AUTOMATIONS.map((auto) => (
          <div key={auto.id} className="card p-5 hover:border-primary/40 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground text-base">{auto.name}</h3>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      activeItems[auto.id]
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                    }`}
                  >
                    {activeItems[auto.id] ? "Running" : "Paused"}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
                  <span className="bg-muted px-2 py-0.5 rounded font-mono text-[11px] text-foreground">
                    IF {auto.trigger}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-medium text-[11px]">
                    THEN {auto.action}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <div className="text-right text-xs text-muted-foreground">
                  <div className="font-mono font-medium text-foreground">{auto.executions} runs</div>
                  <div className="text-[10px] mt-0.5">{auto.lastRun}</div>
                </div>
                <Button
                  variant={activeItems[auto.id] ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => toggleAuto(auto.id)}
                  className="text-xs h-8"
                >
                  {activeItems[auto.id] ? "Pause" : "Enable"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
