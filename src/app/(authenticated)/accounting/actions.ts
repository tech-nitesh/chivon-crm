"use server"

import prisma from "@/lib/db"
import { requirePermission } from "@/lib/permissions"
import { generateBusinessId } from "@/lib/id-generator"
import { createAuditLog } from "@/lib/audit"

export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string }

// ----------------- INVOICES -----------------
export async function getInvoices(params?: { search?: string; status?: string }) {
  await requirePermission("invoices.view")
  const where: any = {}
  if (params?.status && params.status !== "all") where.status = params.status
  if (params?.search) {
    where.OR = [
      { businessId: { contains: params.search } },
      { invoiceNumber: { contains: params.search } },
      { company: { name: { contains: params.search } } },
    ]
  }

  const invoices = await prisma.financeInvoice.findMany({
    where,
    include: {
      company: { select: { id: true, name: true, businessId: true } },
      project: { select: { id: true, businessId: true, title: true } },
      items: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return invoices.map((inv) => ({
    id: inv.id,
    businessId: inv.businessId,
    invoiceNumber: inv.invoiceNumber,
    company: inv.company,
    project: inv.project,
    invoiceDate: inv.invoiceDate.toISOString(),
    dueDate: inv.dueDate.toISOString(),
    subtotal: inv.subtotal,
    taxAmount: inv.taxAmount,
    total: inv.total,
    paidAmount: inv.paidAmount,
    outstanding: inv.outstanding,
    status: inv.status,
    syncStatus: inv.syncStatus,
    itemsCount: inv.items.length,
    paymentsCount: inv.payments.length,
    createdAt: inv.createdAt.toISOString(),
  }))
}

export async function createInvoice(input: {
  companyId: string
  projectId?: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  notes?: string
  items: {
    description: string
    quantity: number
    unitPrice: number
    taxRate?: number
  }[]
}): Promise<ActionResult<{ id: string; businessId: string }>> {
  const session = await requirePermission("invoices.create")
  const businessId = await generateBusinessId("invoice")

  let subtotal = 0
  let totalTax = 0

  const processedItems = input.items.map((it, idx) => {
    const lineSubtotal = it.quantity * it.unitPrice
    const lineTax = lineSubtotal * ((it.taxRate !== undefined ? it.taxRate : 5) / 100)
    const lineTotal = lineSubtotal + lineTax
    subtotal += lineSubtotal
    totalTax += lineTax

    return {
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      taxRate: it.taxRate !== undefined ? it.taxRate : 5,
      total: lineTotal,
      sortOrder: idx,
    }
  })

  const total = subtotal + totalTax

  const invoice = await prisma.financeInvoice.create({
    data: {
      businessId,
      companyId: input.companyId,
      projectId: input.projectId || undefined,
      invoiceNumber: input.invoiceNumber,
      invoiceDate: new Date(input.invoiceDate),
      dueDate: new Date(input.dueDate),
      subtotal,
      taxAmount: totalTax,
      total,
      paidAmount: 0,
      outstanding: total,
      notes: input.notes,
      status: "sent",
      items: {
        create: processedItems,
      },
    },
    include: { company: true },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "invoice",
    entityId: invoice.id,
    action: "create",
    after: { businessId: invoice.businessId, invoiceNumber: invoice.invoiceNumber, total: invoice.total },
  })

  return { success: true, data: { id: invoice.id, businessId: invoice.businessId } }
}

export async function updateInvoiceStatus(id: string, status: string): Promise<ActionResult> {
  const session = await requirePermission("invoices.edit")
  const inv = await prisma.financeInvoice.findUnique({ where: { id } })
  if (!inv) return { success: false, error: "Invoice not found" }

  const updated = await prisma.financeInvoice.update({
    where: { id },
    data: { status },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "invoice",
    entityId: id,
    action: "status_change",
    before: { status: inv.status },
    after: { status: updated.status },
  })

  return { success: true, data: null }
}

// ----------------- PAYMENTS -----------------
export async function getPayments() {
  await requirePermission("invoices.view")
  const payments = await prisma.financePayment.findMany({
    include: {
      company: { select: { id: true, name: true, businessId: true } },
      invoice: { select: { id: true, businessId: true, invoiceNumber: true } },
    },
    orderBy: { paymentDate: "desc" },
  })

  return payments.map((p) => ({
    id: p.id,
    businessId: p.businessId,
    amount: p.amount,
    paymentDate: p.paymentDate.toISOString(),
    paymentMethod: p.paymentMethod,
    reference: p.reference,
    notes: p.notes,
    status: p.status,
    company: p.company,
    invoice: p.invoice,
    createdAt: p.createdAt.toISOString(),
  }))
}

export async function createPayment(input: {
  companyId: string
  invoiceId?: string
  amount: number
  paymentDate: string
  paymentMethod: string
  reference?: string
  notes?: string
}): Promise<ActionResult<{ id: string; businessId: string }>> {
  const session = await requirePermission("invoices.edit")
  const businessId = await generateBusinessId("payment")

  const payment = await prisma.financePayment.create({
    data: {
      businessId,
      companyId: input.companyId,
      invoiceId: input.invoiceId || undefined,
      amount: Number(input.amount),
      paymentDate: new Date(input.paymentDate),
      paymentMethod: input.paymentMethod,
      reference: input.reference,
      notes: input.notes,
      status: "completed",
    },
    include: { company: true },
  })

  // If attached to invoice, reduce outstanding balance
  if (input.invoiceId) {
    const inv = await prisma.financeInvoice.findUnique({ where: { id: input.invoiceId } })
    if (inv) {
      const newPaid = inv.paidAmount + Number(input.amount)
      const newOutstanding = Math.max(0, inv.total - newPaid)
      const newStatus = newOutstanding <= 0 ? "paid" : "partially_paid"

      await prisma.financeInvoice.update({
        where: { id: input.invoiceId },
        data: {
          paidAmount: newPaid,
          outstanding: newOutstanding,
          status: newStatus,
        },
      })
    }
  }

  await createAuditLog({
    userId: session.user.id,
    entityType: "payment",
    entityId: payment.id,
    action: "create",
    after: { businessId: payment.businessId, amount: payment.amount, company: payment.company.name },
  })

  return { success: true, data: { id: payment.id, businessId: payment.businessId } }
}

// ----------------- EXPENSES -----------------
export async function getExpenses() {
  await requirePermission("expenses.view")
  const expenses = await prisma.financeExpense.findMany({
    include: {
      project: { select: { id: true, businessId: true, title: true } },
    },
    orderBy: { date: "desc" },
  })

  return expenses.map((e) => ({
    id: e.id,
    businessId: e.businessId,
    date: e.date.toISOString(),
    category: e.category,
    employeeName: e.employeeName,
    vendorName: e.vendorName,
    amount: e.amount,
    taxAmount: e.taxAmount,
    description: e.description,
    status: e.status,
    project: e.project,
    createdAt: e.createdAt.toISOString(),
  }))
}

export async function createExpense(input: {
  date: string
  category: string
  amount: number
  taxAmount?: number
  employeeName?: string
  vendorName?: string
  projectId?: string
  description?: string
}): Promise<ActionResult<{ id: string; businessId: string }>> {
  const session = await requirePermission("expenses.create")
  const businessId = await generateBusinessId("expense")

  const exp = await prisma.financeExpense.create({
    data: {
      businessId,
      date: new Date(input.date),
      category: input.category,
      amount: Number(input.amount),
      taxAmount: input.taxAmount ? Number(input.taxAmount) : 0,
      employeeName: input.employeeName,
      vendorName: input.vendorName,
      projectId: input.projectId || undefined,
      description: input.description,
      status: "approved",
    },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "expense",
    entityId: exp.id,
    action: "create",
    after: { businessId: exp.businessId, amount: exp.amount, category: exp.category },
  })

  return { success: true, data: { id: exp.id, businessId: exp.businessId } }
}

export async function updateExpenseStatus(id: string, status: string): Promise<ActionResult> {
  const session = await requirePermission("expenses.approve")
  await prisma.financeExpense.update({
    where: { id },
    data: { status },
  })
  return { success: true, data: null }
}

// ----------------- BILLS (SUPPLIER AP) -----------------
export async function getBills() {
  await requirePermission("expenses.view")
  const bills = await prisma.financeBill.findMany({
    include: {
      vendor: { select: { id: true, name: true, businessId: true } },
    },
    orderBy: { billDate: "desc" },
  })

  return bills.map((b) => ({
    id: b.id,
    businessId: b.businessId,
    billNumber: b.billNumber,
    billDate: b.billDate.toISOString(),
    dueDate: b.dueDate.toISOString(),
    amount: b.amount,
    paidAmount: b.paidAmount,
    outstanding: b.outstanding,
    status: b.status,
    notes: b.notes,
    vendor: b.vendor,
    createdAt: b.createdAt.toISOString(),
  }))
}

export async function createBill(input: {
  vendorId: string
  billNumber: string
  billDate: string
  dueDate: string
  amount: number
  notes?: string
}): Promise<ActionResult<{ id: string; businessId: string }>> {
  const session = await requirePermission("expenses.create")
  const businessId = await generateBusinessId("bill")

  const bill = await prisma.financeBill.create({
    data: {
      businessId,
      vendorId: input.vendorId,
      billNumber: input.billNumber,
      billDate: new Date(input.billDate),
      dueDate: new Date(input.dueDate),
      amount: Number(input.amount),
      paidAmount: 0,
      outstanding: Number(input.amount),
      status: "pending",
      notes: input.notes,
    },
    include: { vendor: true },
  })

  await createAuditLog({
    userId: session.user.id,
    entityType: "bill",
    entityId: bill.id,
    action: "create",
    after: { businessId: bill.businessId, billNumber: bill.billNumber, amount: bill.amount },
  })

  return { success: true, data: { id: bill.id, businessId: bill.businessId } }
}

export async function updateBillStatus(id: string, status: string): Promise<ActionResult> {
  const session = await requirePermission("expenses.approve")
  await prisma.financeBill.update({
    where: { id },
    data: { status },
  })
  return { success: true, data: null }
}

// ----------------- RECEIVABLES & PAYABLES AGING -----------------
export async function getReceivablesAging() {
  await requirePermission("invoices.view")
  const now = new Date()
  const invoices = await prisma.financeInvoice.findMany({
    where: { outstanding: { gt: 0 } },
    include: { company: { select: { id: true, name: true, businessId: true } } },
    orderBy: { dueDate: "asc" },
  })

  let current = 0
  let days30 = 0
  let days60 = 0
  let days90Plus = 0
  let totalOutstanding = 0

  const items = invoices.map((inv) => {
    const diffDays = Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 3600 * 24))
    totalOutstanding += inv.outstanding

    let bucket = "current"
    if (diffDays <= 0) {
      current += inv.outstanding
    } else if (diffDays <= 30) {
      days30 += inv.outstanding
      bucket = "1-30 days"
    } else if (diffDays <= 60) {
      days60 += inv.outstanding
      bucket = "31-60 days"
    } else {
      days90Plus += inv.outstanding
      bucket = "90+ days"
    }

    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      company: inv.company,
      total: inv.total,
      outstanding: inv.outstanding,
      dueDate: inv.dueDate.toISOString(),
      overdueDays: Math.max(0, diffDays),
      bucket,
    }
  })

  return {
    items,
    summary: {
      totalOutstanding,
      current,
      days30,
      days60,
      days90Plus,
    },
  }
}

export async function getPayablesAging() {
  await requirePermission("expenses.view")
  const now = new Date()
  const bills = await prisma.financeBill.findMany({
    where: { outstanding: { gt: 0 } },
    include: { vendor: { select: { id: true, name: true, businessId: true } } },
    orderBy: { dueDate: "asc" },
  })

  let totalOutstanding = 0
  let current = 0
  let overdue = 0

  const items = bills.map((b) => {
    const diffDays = Math.floor((now.getTime() - b.dueDate.getTime()) / (1000 * 3600 * 24))
    totalOutstanding += b.outstanding
    if (diffDays > 0) overdue += b.outstanding
    else current += b.outstanding

    return {
      id: b.id,
      billNumber: b.billNumber,
      vendor: b.vendor,
      amount: b.amount,
      outstanding: b.outstanding,
      dueDate: b.dueDate.toISOString(),
      overdueDays: Math.max(0, diffDays),
    }
  })

  return {
    items,
    summary: { totalOutstanding, current, overdue },
  }
}

// ----------------- BANKING & TAX -----------------
export async function getBankAccounts() {
  await requirePermission("invoices.view")
  return prisma.bankAccount.findMany({
    orderBy: { balance: "desc" },
  })
}

export async function createBankAccount(input: {
  name: string
  bankName: string
  accountNumber: string
  currency?: string
  balance?: number
}): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("admin.settings.manage")
  const acct = await prisma.bankAccount.create({
    data: {
      name: input.name,
      bankName: input.bankName,
      accountNumber: input.accountNumber,
      currency: input.currency || "AED",
      balance: Number(input.balance) || 0,
    },
  })
  return { success: true, data: { id: acct.id } }
}

export async function getTaxSummary() {
  await requirePermission("invoices.view")
  const [invoices, expenses] = await Promise.all([
    prisma.financeInvoice.findMany({
      where: { status: { notIn: ["draft", "cancelled"] } },
      select: { subtotal: true, taxAmount: true, total: true },
    }),
    prisma.financeExpense.findMany({
      select: { amount: true, taxAmount: true },
    }),
  ])

  const outputTax = invoices.reduce((sum, inv) => sum + inv.taxAmount, 0)
  const taxableSupplies = invoices.reduce((sum, inv) => sum + inv.subtotal, 0)

  const inputTax = expenses.reduce((sum, exp) => sum + exp.taxAmount, 0)
  const taxablePurchases = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  const netVatPayable = outputTax - inputTax

  return {
    taxableSupplies,
    outputTax,
    taxablePurchases,
    inputTax,
    netVatPayable,
  }
}

export async function getAccountingOptions() {
  await requirePermission("invoices.view")
  const [companies, projects, vendors, invoices] = await Promise.all([
    prisma.company.findMany({
      where: { isActive: true },
      select: { id: true, name: true, businessId: true },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      select: { id: true, businessId: true, title: true, companyId: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vendor.findMany({
      where: { isActive: true },
      select: { id: true, name: true, businessId: true },
      orderBy: { name: "asc" },
    }),
    prisma.financeInvoice.findMany({
      where: { outstanding: { gt: 0 } },
      select: { id: true, businessId: true, invoiceNumber: true, outstanding: true, companyId: true },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return { companies, projects, vendors, invoices }
}
