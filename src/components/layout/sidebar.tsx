"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Wrench,
  FileText,
  DollarSign,
  FolderKanban,
  ShoppingCart,
  BarChart3,
  FileStack,
  Shield,
  ChevronLeft,
  ChevronRight,
  Building2,
  Settings,
  Bell,
  HelpCircle,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { hasAnyPermission } from "@/lib/permissions"

interface SidebarProps {
  permissions: string[]
}

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission?: string
  children?: { label: string; href: string; permission?: string }[]
}

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Business",
    items: [
      {
        label: "Sales",
        href: "/sales",
        icon: TrendingUp,
        permission: "inquiries.view",
        children: [
          { label: "Inquiries", href: "/sales/inquiries" },
          { label: "Opportunities", href: "/sales/opportunities" },
          { label: "Follow-ups", href: "/sales/follow-ups" },
          { label: "Activities", href: "/sales/activities" },
        ],
      },
      {
        label: "Customers",
        href: "/customers",
        icon: Users,
        permission: "customers.view",
        children: [
          { label: "Companies", href: "/customers/companies" },
          { label: "Contacts", href: "/customers/contacts" },
        ],
      },
      {
        label: "Technical",
        href: "/technical",
        icon: Wrench,
        permission: "technical.view",
        children: [
          { label: "Requirements", href: "/technical/requirements" },
          { label: "Site Visits", href: "/technical/site-visits" },
          { label: "BOQ", href: "/technical/boq" },
        ],
      },
      {
        label: "Commercial",
        href: "/commercial",
        icon: FileText,
        permission: "quotations.view",
        children: [
          { label: "Quotations", href: "/commercial/quotations" },
          { label: "Approvals", href: "/commercial/approvals" },
          { label: "Negotiations", href: "/commercial/negotiations" },
          { label: "Purchase Orders", href: "/commercial/purchase-orders" },
        ],
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        label: "Accounting",
        href: "/accounting",
        icon: DollarSign,
        permission: "invoices.view",
        children: [
          { label: "Invoices", href: "/accounting/invoices" },
          { label: "Payments", href: "/accounting/payments" },
          { label: "Expenses", href: "/accounting/expenses" },
          { label: "Bills", href: "/accounting/bills" },
          { label: "Receivables", href: "/accounting/receivables" },
          { label: "Payables", href: "/accounting/payables" },
          { label: "Banking", href: "/accounting/banking" },
          { label: "Tax", href: "/accounting/tax" },
        ],
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Projects",
        href: "/projects",
        icon: FolderKanban,
        permission: "projects.view",
      },
      {
        label: "Procurement",
        href: "/procurement",
        icon: ShoppingCart,
        permission: "vendors.view",
        children: [
          { label: "Vendors", href: "/procurement/vendors" },
          { label: "Requests", href: "/procurement/requests" },
          { label: "Purchase Orders", href: "/procurement/purchase-orders" },
        ],
      },
    ],
  },
  {
    label: "Analytics",
    items: [
      {
        label: "Reports",
        href: "/reports",
        icon: BarChart3,
        permission: "reports.view",
        children: [
          { label: "Sales", href: "/reports/sales" },
          { label: "Finance", href: "/reports/finance" },
          { label: "Projects", href: "/reports/projects" },
          { label: "Services", href: "/reports/services" },
        ],
      },
      { label: "Documents", href: "/documents", icon: FileStack, permission: "documents.view" },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "Admin",
        href: "/admin",
        icon: Shield,
        permission: "admin.users.manage",
        children: [
          { label: "Users", href: "/admin/users" },
          { label: "Roles", href: "/admin/roles" },
          { label: "Departments", href: "/admin/departments" },
          { label: "Services", href: "/admin/services" },
          { label: "Approval Rules", href: "/admin/approval-rules" },
          { label: "Automation", href: "/admin/automation" },
          { label: "Integrations", href: "/admin/integrations" },
          { label: "Audit Logs", href: "/admin/audit-logs" },
        ],
      },
    ],
  },
]

export function Sidebar({ permissions }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  // Auto-expand active section
  React.useEffect(() => {
    for (const section of navSections) {
      for (const item of section.items) {
        if (pathname.startsWith(item.href) && item.children) {
          setExpandedItems((prev) => (prev.includes(item.href) ? prev : [...prev, item.href]))
        }
      }
    }
  }, [pathname])

  const toggleExpand = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    )
  }

  const isVisible = (permission?: string) => {
    if (!permission) return true
    return hasAnyPermission(permissions, permission)
  }

  return (
    <aside className={cn("sidebar", collapsed && "collapsed")}>
      {/* Brand */}
      <div className="sidebar-brand">
        <Building2 className="w-7 h-7 text-white flex-shrink-0" />
        {!collapsed && (
          <span className="sidebar-brand-text">CHIVON</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) => isVisible(item.permission))
          if (visibleItems.length === 0) return null

          return (
            <div key={section.label}>
              {!collapsed && (
                <div className="sidebar-section-label">{section.label}</div>
              )}
              {visibleItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                const isExpanded = expandedItems.includes(item.href)
                const Icon = item.icon

                return (
                  <div key={item.href}>
                    {item.children ? (
                      <>
                        <button
                          onClick={() => toggleExpand(item.href)}
                          className={cn("sidebar-link w-full", isActive && "active")}
                          title={collapsed ? item.label : undefined}
                        >
                          <Icon className="sidebar-link-icon" />
                          {!collapsed && (
                            <>
                              <span className="flex-1 text-left">{item.label}</span>
                              <ChevronRight
                                className={cn(
                                  "w-3.5 h-3.5 transition-transform",
                                  isExpanded && "rotate-90"
                                )}
                              />
                            </>
                          )}
                        </button>
                        {!collapsed && isExpanded && (
                          <div className="ml-4 mt-0.5 space-y-0.5">
                            {item.children
                              .filter((child) => isVisible(child.permission))
                              .map((child) => {
                                const childActive = pathname === child.href || pathname.startsWith(child.href + "/")
                                return (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    className={cn(
                                      "sidebar-link text-[0.8125rem] pl-5",
                                      childActive && "active"
                                    )}
                                  >
                                    {child.label}
                                  </Link>
                                )
                              })}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn("sidebar-link", isActive && "active")}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className="sidebar-link-icon" />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-white/8">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-link w-full justify-center"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
