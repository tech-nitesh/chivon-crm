import { z } from "zod"

// ============================================================
// Company Schemas
// ============================================================

export const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(200),
  industry: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
})

export type CreateCompanyInput = z.infer<typeof createCompanySchema>

export const updateCompanySchema = createCompanySchema.partial()

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>

// ============================================================
// Contact Schemas
// ============================================================

export const createContactSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  isPrimary: z.boolean().default(false),
  isDecisionMaker: z.boolean().default(false),
  notes: z.string().optional(),
})

export type CreateContactInput = z.infer<typeof createContactSchema>

// ============================================================
// Inquiry Schemas
// ============================================================

export const createInquirySchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  contactId: z.string().optional(),
  serviceId: z.string().optional(),
  discipline: z.string().optional(),
  scope: z.string().min(1, "Scope is required"),
  location: z.string().optional(),
  estimatedValue: z.number().min(0).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  source: z.enum([
    "website", "email", "whatsapp", "phone", "linkedin",
    "referral", "exhibition", "tender", "existing_customer",
    "cold_outreach", "other"
  ]).default("other"),
  departmentId: z.string().optional(),
  salespersonId: z.string().optional(),
  technicalOwnerId: z.string().optional(),
})

export type CreateInquiryInput = z.infer<typeof createInquirySchema>

export const qualifyInquirySchema = z.object({
  customerNeed: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  decisionMaker: z.string().optional(),
  currentVendor: z.string().optional(),
  competitor: z.string().optional(),
  urgency: z.string().optional(),
  technicalReq: z.string().optional(),
  estimatedValue: z.number().min(0).optional(),
})

export type QualifyInquiryInput = z.infer<typeof qualifyInquirySchema>

// ============================================================
// Opportunity Schemas
// ============================================================

export const createOpportunitySchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  contactId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  estimatedValue: z.number().min(0).optional(),
  stage: z.enum([
    "qualified", "technical", "site_visit", "quotation",
    "negotiation", "awaiting_po", "won", "lost"
  ]).default("qualified"),
  probability: z.number().min(0).max(100).default(10),
  expectedCloseDate: z.string().optional(),
  notes: z.string().optional(),
  lostReason: z.string().optional(),
})

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>

// ============================================================
// Activity Schemas
// ============================================================

export const createActivitySchema = z.object({
  type: z.enum(["call", "meeting", "email", "whatsapp", "note"]),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  opportunityId: z.string().optional(),
  inquiryId: z.string().optional(),
  projectId: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
})

export type CreateActivityInput = z.infer<typeof createActivitySchema>

// ============================================================
// Follow-up Schemas
// ============================================================

export const createFollowUpSchema = z.object({
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  opportunityId: z.string().optional(),
  action: z.string().min(1, "Action is required"),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  notes: z.string().optional(),
})

export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>

// ============================================================
// Quotation Schemas
// ============================================================

export const createQuotationSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  contactId: z.string().optional(),
  opportunityId: z.string().optional(),
  currency: z.string().default("AED"),
  validityDays: z.number().min(1).default(30),
  paymentTerms: z.string().optional(),
  deliveryTerms: z.string().optional(),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(0.01, "Quantity must be positive"),
    unit: z.string().default("nos"),
    unitPrice: z.number().min(0, "Unit price must be non-negative"),
    discount: z.number().min(0).max(100).default(0),
    taxRate: z.number().min(0).max(100).default(5),
    notes: z.string().optional(),
  })).min(1, "At least one item is required"),
})

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>

// ============================================================
// Invoice Schemas
// ============================================================

export const createInvoiceSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  projectId: z.string().optional(),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().min(0.01),
    unitPrice: z.number().min(0),
    taxRate: z.number().min(0).max(100).default(5),
  })).min(1, "At least one item is required"),
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>

// ============================================================
// Payment Schemas
// ============================================================

export const createPaymentSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  invoiceId: z.string().optional(),
  amount: z.number().min(0.01, "Amount must be positive"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.enum(["bank_transfer", "cheque", "cash", "card", "online"]).default("bank_transfer"),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>

// ============================================================
// Vendor Schemas
// ============================================================

export const createVendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  contactName: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  products: z.string().optional(),
  paymentTerms: z.string().optional(),
  leadTime: z.string().optional(),
  notes: z.string().optional(),
})

export type CreateVendorInput = z.infer<typeof createVendorSchema>

// ============================================================
// Project Schemas
// ============================================================

export const createProjectSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  purchaseOrderId: z.string().optional(),
  title: z.string().min(1, "Project title is required"),
  description: z.string().optional(),
  managerId: z.string().optional(),
  contractValue: z.number().min(0).default(0),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

// ============================================================
// Website RFP Webhook Schema
// ============================================================

export const websiteInquirySchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  service: z.string().optional(),
  message: z.string().min(1, "Message is required"),
  location: z.string().optional(),
  source: z.string().default("website"),
  idempotencyKey: z.string().optional(),
})

export type WebsiteInquiryInput = z.infer<typeof websiteInquirySchema>
