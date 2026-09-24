# CHIVON CRM — Testing Guide

## Testing Stack

- **Vitest** — Unit and integration tests
- **Testing Library** — Component testing
- **Playwright** — End-to-end tests

## Running Tests

```bash
# All tests
npm test

# Unit tests
npm run test:unit

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e
```

## Test Coverage Areas

### Unit Tests
- Validation schemas (Zod)
- Financial calculation functions
- Business ID generation
- Permission checking utilities
- Status transition validation
- Date utilities

### Integration Tests
- Server Actions (CRUD operations)
- Authorization enforcement
- Database constraint validation
- Webhook processing
- Accounting sync idempotency

### E2E Tests (Critical Workflows)
1. Login flow
2. Create company → contact → inquiry
3. Qualify inquiry → convert to opportunity
4. Create technical requirement → site visit → BOQ
5. Generate quotation → revision → approval
6. PO creation → project creation
7. Invoice → payment → outstanding balance
8. Customer 360 view verification
9. Website webhook → inquiry creation
10. Dashboard KPI accuracy

## Test Structure

```
__tests__/
  unit/
    validation/
    calculations/
    permissions/
    utils/
  integration/
    actions/
    api/
    auth/
  e2e/
    workflows/
```

## Writing Tests

### Server Action Test
```typescript
import { describe, it, expect } from 'vitest'
import { createCompany } from '@/app/(authenticated)/customers/actions'

describe('createCompany', () => {
  it('creates a company with valid data', async () => {
    const result = await createCompany({
      name: 'Test Company',
      industry: 'Manufacturing',
      // ...
    })
    expect(result.success).toBe(true)
  })

  it('rejects unauthorized users', async () => {
    // Test with viewer role
  })
})
```

## CI/CD

Tests run on every push and pull request.
Production deployment blocked if critical tests fail.
