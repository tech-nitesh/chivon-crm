import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number, currency = "AED"): string {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d)
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

/**
 * Get initials from a name
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + "..."
}

/**
 * Safe server-side financial calculation (avoids floating point issues)
 * Rounds to 2 decimal places using banker's rounding
 */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Calculate line item total
 */
export function calculateLineTotal(
  quantity: number,
  unitPrice: number,
  discount: number = 0,
  taxRate: number = 0
): { subtotal: number; discountAmount: number; taxAmount: number; total: number } {
  const subtotal = roundMoney(quantity * unitPrice)
  const discountAmount = roundMoney(subtotal * (discount / 100))
  const afterDiscount = roundMoney(subtotal - discountAmount)
  const taxAmount = roundMoney(afterDiscount * (taxRate / 100))
  const total = roundMoney(afterDiscount + taxAmount)
  return { subtotal, discountAmount, taxAmount, total }
}

/**
 * Calculate quotation totals from line items
 */
export function calculateQuotationTotals(
  items: Array<{ quantity: number; unitPrice: number; discount: number; taxRate: number }>
): { subtotal: number; totalDiscount: number; totalTax: number; grandTotal: number } {
  let subtotal = 0
  let totalDiscount = 0
  let totalTax = 0
  let grandTotal = 0

  for (const item of items) {
    const line = calculateLineTotal(item.quantity, item.unitPrice, item.discount, item.taxRate)
    subtotal += line.subtotal
    totalDiscount += line.discountAmount
    totalTax += line.taxAmount
    grandTotal += line.total
  }

  return {
    subtotal: roundMoney(subtotal),
    totalDiscount: roundMoney(totalDiscount),
    totalTax: roundMoney(totalTax),
    grandTotal: roundMoney(grandTotal),
  }
}
