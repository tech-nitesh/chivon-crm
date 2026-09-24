# CHIVON CRM — Architecture Decisions

## ADR-001: Next.js App Router
**Decision**: Use Next.js 14+ with App Router  
**Rationale**: Server Components reduce client bundle, Server Actions simplify API layer, built-in file-system routing matches the extensive route structure.

## ADR-002: SQLite for Development
**Decision**: Use SQLite for local development, PostgreSQL for production  
**Rationale**: Zero infrastructure needed for local dev. Prisma abstracts SQL dialect differences. Migration to PostgreSQL is a datasource URL change.

## ADR-003: Server Actions for Mutations
**Decision**: Use Server Actions instead of separate API routes for most CRUD operations  
**Rationale**: Type-safe end-to-end, automatic request handling, simpler than maintaining a separate API layer. API routes reserved for webhooks and external integrations.

## ADR-004: Prisma ORM
**Decision**: Use Prisma as the ORM  
**Rationale**: Type-safe queries, automatic migration generation, excellent TypeScript integration, schema-as-code.

## ADR-005: RBAC with Database-backed Permissions
**Decision**: Store roles and permissions in the database, not in code constants  
**Rationale**: Allows admin configuration without code deployment. System roles are seeded and protected.

## ADR-006: Accounting Adapter Pattern
**Decision**: Implement accounting integrations through an adapter interface  
**Rationale**: Allows swapping providers (QuickBooks, Zoho, Xero) without touching business logic. CRM stores its own read model of financial data.

## ADR-007: Business ID Generation
**Decision**: Auto-generate human-readable business IDs (CHV-CMP-00001)  
**Rationale**: Users need memorable references for phone/email communication. Internal UUIDs/CUIDs are used as primary keys, business IDs as display identifiers.

## ADR-008: Decimal for Money
**Decision**: Use Prisma Decimal type (mapped to REAL in SQLite, DECIMAL in PostgreSQL)  
**Rationale**: Floating-point arithmetic is unsuitable for financial calculations. Server-authoritative calculations prevent client-side rounding errors.

## ADR-009: shadcn/ui Components  
**Decision**: Use shadcn/ui as the component library  
**Rationale**: Unstyled, accessible primitives that we own (copied into project). No version lock-in. Tailwind-native. Enterprise-appropriate.

## ADR-010: Quotation Version Immutability
**Decision**: Never overwrite sent quotation data. Create new versions.  
**Rationale**: Business/legal requirement. Audit trail for all commercial communications.
