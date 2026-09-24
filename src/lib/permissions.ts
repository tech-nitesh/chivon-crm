import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

/**
 * Get the current session or redirect to login
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }
  return session
}

/**
 * Check if the current user has a specific permission
 */
export async function requirePermission(permission: string) {
  const session = await requireAuth()
  if (!hasPermission(session.user.permissions, permission)) {
    throw new Error(`Unauthorized: missing permission '${permission}'`)
  }
  return session
}

/**
 * Check permission from a permissions array
 */
export function hasPermission(permissions: string[], permission: string): boolean {
  // Super admin has all permissions
  return permissions.includes("*") || permissions.includes(permission)
}

/**
 * Check if user has any of the specified roles
 */
export function hasRole(roles: string[], ...requiredRoles: string[]): boolean {
  return requiredRoles.some((r) => roles.includes(r))
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(permissions: string[], ...requiredPermissions: string[]): boolean {
  if (permissions.includes("*")) return true
  return requiredPermissions.some((p) => permissions.includes(p))
}

/**
 * Standard permission slugs used throughout the application
 */
export const PERMISSIONS = {
  // Customers
  CUSTOMERS_VIEW: "customers.view",
  CUSTOMERS_CREATE: "customers.create",
  CUSTOMERS_EDIT: "customers.edit",
  CUSTOMERS_DELETE: "customers.delete",

  // Inquiries
  INQUIRIES_VIEW: "inquiries.view",
  INQUIRIES_CREATE: "inquiries.create",
  INQUIRIES_EDIT: "inquiries.edit",
  INQUIRIES_ASSIGN: "inquiries.assign",

  // Opportunities
  OPPORTUNITIES_VIEW: "opportunities.view",
  OPPORTUNITIES_CREATE: "opportunities.create",
  OPPORTUNITIES_EDIT: "opportunities.edit",

  // Quotations
  QUOTATIONS_VIEW: "quotations.view",
  QUOTATIONS_CREATE: "quotations.create",
  QUOTATIONS_EDIT: "quotations.edit",
  QUOTATIONS_APPROVE: "quotations.approve",
  QUOTATIONS_SEND: "quotations.send",

  // Projects
  PROJECTS_VIEW: "projects.view",
  PROJECTS_CREATE: "projects.create",
  PROJECTS_EDIT: "projects.edit",

  // Invoices
  INVOICES_VIEW: "invoices.view",
  INVOICES_CREATE: "invoices.create",
  INVOICES_EDIT: "invoices.edit",

  // Payments
  PAYMENTS_VIEW: "payments.view",
  PAYMENTS_CREATE: "payments.create",

  // Expenses
  EXPENSES_VIEW: "expenses.view",
  EXPENSES_CREATE: "expenses.create",
  EXPENSES_EDIT: "expenses.edit",

  // Bills
  BILLS_VIEW: "bills.view",
  BILLS_CREATE: "bills.create",
  BILLS_EDIT: "bills.edit",

  // Vendors
  VENDORS_VIEW: "vendors.view",
  VENDORS_CREATE: "vendors.create",
  VENDORS_EDIT: "vendors.edit",

  // Reports
  REPORTS_VIEW: "reports.view",
  REPORTS_EXPORT: "reports.export",

  // Documents
  DOCUMENTS_VIEW: "documents.view",
  DOCUMENTS_UPLOAD: "documents.upload",
  DOCUMENTS_DELETE: "documents.delete",

  // Technical
  TECHNICAL_VIEW: "technical.view",
  TECHNICAL_CREATE: "technical.create",
  TECHNICAL_EDIT: "technical.edit",

  // Admin
  ADMIN_USERS_MANAGE: "admin.users.manage",
  ADMIN_ROLES_MANAGE: "admin.roles.manage",
  ADMIN_SETTINGS_MANAGE: "admin.settings.manage",
} as const
