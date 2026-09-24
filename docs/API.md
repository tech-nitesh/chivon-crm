# CHIVON CRM — API Documentation

## Overview

The API is primarily consumed through Next.js Server Actions (for authenticated UI operations) and API Routes (for external integrations/webhooks).

## Authentication

All server actions and protected API routes require a valid session.  
Sessions are managed via NextAuth.js with secure HTTP-only cookies.

## Server Actions

Server Actions are the primary mutation interface. They:
- Validate input with Zod schemas
- Check RBAC permissions
- Execute database operations via Prisma
- Return typed results

### Convention
```typescript
// /src/app/(authenticated)/module/actions.ts
'use server'

export async function createEntity(data: CreateEntityInput) {
  // 1. Get session
  // 2. Check permissions
  // 3. Validate input
  // 4. Execute
  // 5. Audit log
  // 6. Return result
}
```

## API Routes (External)

### POST /api/webhooks/website/inquiry
Receives website RFP form submissions.

**Request:**
```json
{
  "name": "John Doe",
  "company": "Acme Corp",
  "email": "john@acme.com",
  "phone": "+971-50-123-4567",
  "service": "PLC / Automation",
  "message": "Looking for SCADA system upgrade",
  "location": "Dubai",
  "source": "website",
  "idempotency_key": "uuid-v4"
}
```

**Response:**
```json
{
  "success": true,
  "inquiry_id": "CHV-ENQ-00042"
}
```

### GET /api/health
Health check endpoint.

## Accounting Integration API

### Internal adapter interface:
```typescript
interface AccountingProvider {
  connect(credentials: ConnectionConfig): Promise<Connection>
  syncCustomers(): Promise<SyncResult>
  syncInvoices(): Promise<SyncResult>
  syncPayments(): Promise<SyncResult>
  getAccounts(): Promise<Account[]>
}
```

Specific implementations:
- QuickBooksAdapter
- ZohoBooksAdapter
- (Future providers)

## Error Handling

All server actions return a consistent result type:
```typescript
type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; field_errors?: Record<string, string[]> }
```

## Rate Limiting

Webhook endpoints are rate-limited to prevent abuse.
Login endpoint has rate limiting to prevent brute force attacks.
