# CHIVON CRM — Architecture

## System Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│  Next.js App Router (React Server Components)    │
│  + Client Components for interactive UI          │
├─────────────────────────────────────────────────┤
│              Next.js Server                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Server   │  │  API     │  │  Webhooks    │  │
│  │  Actions  │  │  Routes  │  │  /api/...    │  │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│       │              │               │           │
│  ┌────┴──────────────┴───────────────┴───────┐  │
│  │           Service Layer                    │  │
│  │  auth / crm / technical / commercial /     │  │
│  │  accounting / projects / procurement /     │  │
│  │  documents / notifications / automation    │  │
│  └────────────────┬──────────────────────────┘  │
│                   │                              │
│  ┌────────────────┴──────────────────────────┐  │
│  │           Prisma ORM                       │  │
│  └────────────────┬──────────────────────────┘  │
│                   │                              │
├───────────────────┼─────────────────────────────┤
│                   │                              │
│  ┌────────────────┴──────────────────────────┐  │
│  │      SQLite (dev) / PostgreSQL (prod)      │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │      Integration Adapters                  │  │
│  │  Accounting │ Email │ WhatsApp │ Calendar  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## Module Boundaries

### Auth Module (`/lib/auth/`)
- Session management
- Password hashing (bcrypt)
- RBAC enforcement
- Permission checks

### CRM Module (`/lib/crm/`)
- Companies, contacts
- Inquiries, qualification
- Opportunities, pipeline
- Activities, follow-ups

### Technical Module (`/lib/technical/`)
- Requirements with dynamic templates
- Site visits
- BOQ builder

### Commercial Module (`/lib/commercial/`)
- Quotations with line items
- Revision management
- Approval workflow
- Negotiation tracking
- Purchase orders

### Accounting Module (`/lib/accounting/`)
- Invoices, payments
- Expenses, bills
- Receivables, payables
- Banking, tax

### Projects Module (`/lib/projects/`)
- Project lifecycle
- Tasks, milestones
- Project finance
- Commissioning, handover

### Procurement Module (`/lib/procurement/`)
- Vendors
- Purchase requests
- Procurement orders

### Integration Module (`/lib/integrations/`)
- Accounting adapter (QuickBooks, Zoho, etc.)
- Email service interface
- WhatsApp service interface
- Calendar service interface
- Website RFP webhook handler

## Data Ownership

| Data | Owner | Notes |
|---|---|---|
| Companies, Contacts | CRM | Source of truth for customer data |
| Inquiries, Opportunities | CRM | Sales pipeline data |
| Quotations, POs | CRM | Commercial data |
| Invoices (CRM copy) | CRM | Read model, synced from accounting |
| Invoices (authoritative) | Accounting Provider | Financial source of truth |
| Payments | Accounting Provider | Financial source of truth |
| Projects, Tasks | CRM | Operational data |
| Documents | CRM | File management |
| Users, Roles | CRM | Identity & access |

## Key Design Principles

1. **Server-first**: Business logic runs on the server via Server Actions
2. **Type-safe**: End-to-end TypeScript with Prisma + Zod
3. **Permission-enforced**: Every server action checks RBAC
4. **Financial integrity**: Decimal types, server-authoritative calculations
5. **Audit trail**: Critical operations logged
6. **Adapter pattern**: External integrations are pluggable
7. **Progressive data flow**: Records transform through lifecycle stages
