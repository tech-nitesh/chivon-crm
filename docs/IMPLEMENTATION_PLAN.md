# CHIVON CRM — Implementation Plan

## Repository State

- **Initial state**: Empty directory
- **Decision**: Greenfield Next.js 14+ application with App Router

## Architecture Decision

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Database | SQLite (via better-sqlite3) for dev, PostgreSQL-ready via Prisma |
| ORM | Prisma |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Validation | Zod |
| Forms | React Hook Form + @hookform/resolvers |
| Charts | Recharts |
| Auth | NextAuth.js v5 (Auth.js) with credentials + session |
| PDF | @react-pdf/renderer |
| State | React Server Components + Server Actions + minimal client state |
| Testing | Vitest + Playwright |
| Icons | Lucide React |

### Why SQLite for initial dev?
- Zero infrastructure needed to start
- Prisma abstracts the SQL dialect — switching to PostgreSQL is a config change
- Faster local development iteration
- The schema is designed PostgreSQL-compatible (DECIMAL types, etc.)

## Major Modules

1. **Auth & RBAC** — Login, sessions, roles, permissions
2. **Master Data** — Departments, services, categories, tax config
3. **CRM Core** — Companies, contacts, inquiries, opportunities, activities
4. **Technical** — Requirements, templates, site visits, BOQ
5. **Commercial** — Quotations, revisions, approvals, negotiations, POs
6. **Accounting** — Invoices, payments, expenses, bills, receivables, payables, banking, tax
7. **Projects** — Lifecycle, tasks, milestones, procurement, finance
8. **Procurement** — Vendors, purchase requests, procurement orders
9. **Documents** — File management with access control
10. **After-Sales** — Warranty, maintenance, service requests
11. **Reports** — Sales, finance, projects, services
12. **Notifications** — In-app notification system
13. **Automation** — Rule engine for business workflows
14. **Integrations** — Website RFP, email, WhatsApp, calendar, accounting adapters
15. **Admin** — Users, roles, settings, audit logs

## Database Domains

See DATABASE.md for full schema.

## Dependency Order

```
Auth → Master Data → Companies/Contacts → Inquiries → Opportunities
→ Technical → BOQ → Quotations → Approvals → PO → Projects
→ Invoices → Payments → Reports → Notifications → Automation
```

## Implementation Phases

### Phase 0: Repository Audit & Planning ✅
- Inspect repository
- Create architecture docs
- Create implementation plan

### Phase 1: Foundation
- Next.js project setup
- Prisma + database schema
- Authentication (login, sessions)
- RBAC (roles, permissions)
- App shell (sidebar, topbar)
- Master data admin

### Phase 2: Core CRM
- Companies CRUD
- Contacts CRUD
- Inquiries with full workflow
- Qualification
- Opportunities with pipeline (Kanban + List)
- Activities & follow-ups

### Phase 3: Technical Module
- Technical requirements with dynamic templates
- Site visits with checklists
- BOQ builder

### Phase 4: Commercial Module
- Quotation builder with line items
- Financial calculations (server-authoritative)
- Revision system
- Approval workflow
- Negotiation tracking
- Purchase order creation from quotation

### Phase 5: Accounting Module
- Accounting dashboard
- Invoice workflow (draft → sent → paid)
- Payment tracking with partial payments
- Expenses
- Bills / payables
- Receivables & payables aging
- Banking display
- Tax configuration
- Accounting integration adapter architecture

### Phase 6: Projects Module
- Project creation from PO
- Task management
- Milestones
- Procurement within projects
- Project finance tracking
- Document management
- Testing/commissioning/handover

### Phase 7: Management Layer
- Customer 360 view
- Role-aware dashboards
- Reports with drill-down
- In-app notifications
- Audit logging
- Automation engine

### Phase 8: External Integrations
- Website RFP webhook API
- Email service interface
- WhatsApp service interface
- Calendar service interface
- Accounting provider adapter enhancements

### Phase 9: Final QA
- End-to-end lifecycle test
- Security review
- Production build validation
- UI polish
- Bug fixes
- Documentation update

## Testing Strategy

- **Unit tests**: Validation schemas, utility functions, financial calculations
- **Integration tests**: Server actions, API routes, database operations
- **Authorization tests**: Every protected action tested with wrong roles
- **E2E tests**: Critical business workflows (inquiry → payment lifecycle)

## Integration Strategy

All external integrations use adapter pattern:
```
/lib/integrations/accounting/adapter.ts
/lib/integrations/email/adapter.ts
/lib/integrations/whatsapp/adapter.ts
/lib/integrations/calendar/adapter.ts
```

## Known External Dependencies

- PostgreSQL (production) / SQLite (development)
- Node.js 18+
- npm/pnpm
- Optional: QuickBooks/Zoho API credentials
- Optional: Email provider credentials
- Optional: WhatsApp Business API credentials
