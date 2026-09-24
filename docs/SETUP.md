# CHIVON CRM — Setup Guide

## Prerequisites

- Node.js 18+
- npm 9+

## Quick Start

```bash
# 1. Clone the repository
cd chivon-crm

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Generate Prisma client
npx prisma generate

# 5. Run database migrations
npx prisma db push

# 6. Seed database with development data
npx prisma db seed

# 7. Start development server
npm run dev
```

Visit http://localhost:3000

## Default Login Credentials (Development Only)

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@chivon.com | ChivonAdmin2024! |
| Director | director@chivon.com | ChivonDir2024! |
| Sales Manager | sales.mgr@chivon.com | ChivonSales2024! |
| Sales Executive | sales@chivon.com | ChivonSales2024! |
| Technical Manager | tech.mgr@chivon.com | ChivonTech2024! |
| Finance | finance@chivon.com | ChivonFin2024! |

## Environment Variables

See `.env.example` for all required variables.

### Required
```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret-key-min-32-chars"
APP_URL="http://localhost:3000"
```

### Optional (External Integrations)
```
# Email
EMAIL_PROVIDER_KEY=""

# WhatsApp
WHATSAPP_API_KEY=""

# Accounting
ACCOUNTING_PROVIDER=""
ACCOUNTING_CLIENT_ID=""
ACCOUNTING_CLIENT_SECRET=""
ACCOUNTING_REDIRECT_URI=""

# Storage
STORAGE_URL=""
STORAGE_KEY=""
```

## Database

### Development (SQLite)
```
DATABASE_URL="file:./dev.db"
```

### Production (PostgreSQL)
```
DATABASE_URL="postgresql://user:password@host:5432/chivon_crm"
```

## Build

```bash
npm run build
```

## Testing

```bash
npm test           # Run all tests
npm run test:unit  # Unit tests only
npm run test:e2e   # End-to-end tests
```
