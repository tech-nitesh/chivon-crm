# CHIVON CRM — Database Schema

## Overview

The database uses a normalized relational design with the following domain groups:

## Identity & Access

### users
| Column | Type | Notes |
|---|---|---|
| id | TEXT (CUID) | Primary key |
| email | TEXT | Unique, indexed |
| password_hash | TEXT | bcrypt hashed |
| first_name | TEXT | |
| last_name | TEXT | |
| phone | TEXT | |
| avatar_url | TEXT | |
| department_id | TEXT | FK → departments |
| is_active | BOOLEAN | Default true |
| last_login_at | DATETIME | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### roles
| Column | Type | Notes |
|---|---|---|
| id | TEXT (CUID) | Primary key |
| name | TEXT | Unique (e.g., "Super Admin") |
| slug | TEXT | Unique (e.g., "super_admin") |
| description | TEXT | |
| data_scope | TEXT | own/team/department/all |
| is_system | BOOLEAN | Cannot be deleted |

### permissions
| Column | Type | Notes |
|---|---|---|
| id | TEXT (CUID) | Primary key |
| resource | TEXT | e.g., "customers" |
| action | TEXT | e.g., "view", "create", "edit", "delete" |
| slug | TEXT | Unique (e.g., "customers.view") |

### role_permissions
| Column | Type | Notes |
|---|---|---|
| role_id | TEXT | FK → roles |
| permission_id | TEXT | FK → permissions |

### user_roles
| Column | Type | Notes |
|---|---|---|
| user_id | TEXT | FK → users |
| role_id | TEXT | FK → roles |

## Organization

### departments
| Column | Type | Notes |
|---|---|---|
| id | TEXT | Primary key |
| name | TEXT | Unique |
| code | TEXT | |
| manager_id | TEXT | FK → users |
| is_active | BOOLEAN | |

### services
| Column | Type | Notes |
|---|---|---|
| id | TEXT | Primary key |
| name | TEXT | |
| category_id | TEXT | FK → service_categories |
| description | TEXT | |
| is_active | BOOLEAN | |

### service_categories
| Column | Type | Notes |
|---|---|---|
| id | TEXT | Primary key |
| name | TEXT | Unique |

### tax_rates
| Column | Type | Notes |
|---|---|---|
| id | TEXT | Primary key |
| name | TEXT | e.g., "VAT 5%" |
| rate | DECIMAL | e.g., 5.00 |
| type | TEXT | sales/purchase/both |
| is_default | BOOLEAN | |
| is_active | BOOLEAN | |

## CRM

### companies
| Column | Type | Notes |
|---|---|---|
| id | TEXT | Primary key |
| business_id | TEXT | Unique, e.g., "CHV-CMP-00001" |
| name | TEXT | |
| industry | TEXT | |
| website | TEXT | |
| email | TEXT | |
| phone | TEXT | |
| address | TEXT | |
| city | TEXT | |
| state | TEXT | |
| country | TEXT | |
| postal_code | TEXT | |
| notes | TEXT | |
| owner_id | TEXT | FK → users |
| is_active | BOOLEAN | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### contacts
| Column | Type | Notes |
|---|---|---|
| id | TEXT | Primary key |
| business_id | TEXT | Unique, e.g., "CHV-CON-00001" |
| company_id | TEXT | FK → companies |
| first_name | TEXT | |
| last_name | TEXT | |
| email | TEXT | |
| phone | TEXT | |
| mobile | TEXT | |
| designation | TEXT | |
| department | TEXT | |
| is_primary | BOOLEAN | |
| is_decision_maker | BOOLEAN | |
| notes | TEXT | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### inquiries
| Column | Type | Notes |
|---|---|---|
| id | TEXT | Primary key |
| business_id | TEXT | Unique, e.g., "CHV-ENQ-00001" |
| company_id | TEXT | FK → companies |
| contact_id | TEXT | FK → contacts |
| service_id | TEXT | FK → services |
| discipline | TEXT | |
| scope | TEXT | |
| location | TEXT | |
| estimated_value | DECIMAL | |
| priority | TEXT | low/medium/high/urgent |
| source | TEXT | website/email/whatsapp/phone/... |
| department_id | TEXT | FK → departments |
| salesperson_id | TEXT | FK → users |
| technical_owner_id | TEXT | FK → users |
| status | TEXT | new/qualified/converted/lost/closed |
| idempotency_key | TEXT | For webhook dedup |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### opportunities
| Column | Type | Notes |
|---|---|---|
| id | TEXT | Primary key |
| business_id | TEXT | Unique, e.g., "CHV-OPP-00001" |
| inquiry_id | TEXT | FK → inquiries |
| company_id | TEXT | FK → companies |
| contact_id | TEXT | FK → contacts |
| title | TEXT | |
| estimated_value | DECIMAL | |
| stage | TEXT | qualified/technical/site_visit/quotation/negotiation/awaiting_po/won/lost |
| probability | INTEGER | 0-100 |
| expected_close_date | DATE | |
| owner_id | TEXT | FK → users |
| lost_reason | TEXT | |
| notes | TEXT | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### activities
| Column | Type | Notes |
|---|---|---|
| id | TEXT | Primary key |
| type | TEXT | call/meeting/email/whatsapp/note |
| subject | TEXT | |
| description | TEXT | |
| company_id | TEXT | FK → companies |
| contact_id | TEXT | FK → contacts |
| opportunity_id | TEXT | FK → opportunities |
| inquiry_id | TEXT | FK → inquiries |
| user_id | TEXT | FK → users |
| due_date | DATETIME | |
| completed_at | DATETIME | |
| priority | TEXT | |
| status | TEXT | pending/completed/cancelled |
| created_at | DATETIME | |

### follow_ups
| Column | Type | Notes |
|---|---|---|
| id | TEXT | Primary key |
| company_id | TEXT | FK → companies |
| contact_id | TEXT | FK → contacts |
| opportunity_id | TEXT | FK → opportunities |
| action | TEXT | |
| owner_id | TEXT | FK → users |
| due_date | DATETIME | |
| priority | TEXT | |
| status | TEXT | pending/completed/overdue/cancelled |
| notes | TEXT | |
| created_at | DATETIME | |
| completed_at | DATETIME | |

## Technical

### technical_requirements
Fields include: inquiry_id, opportunity_id, service, template fields (JSON), status, engineer assignments.

### site_visits
Fields include: opportunity_id, company_id, location, date, engineers, purpose, checklist, outcome, next_action.

### boqs
Fields include: opportunity_id, sections with items, quantities, costs, selling prices.

## Commercial

### quotations
Fields include: company_id, opportunity_id, currency, validity, payment_terms, delivery_terms, status, totals.

### quotation_versions
Full revision history with version numbers, line items snapshot, approval state.

### quotation_items
Line items with description, quantity, unit, unit_price, discount, tax, total.

### quotation_approvals
Approval workflow with approver, status, comments, timestamps.

### negotiations
Price, discount, terms tracking tied to quotation versions.

### purchase_orders
PO number, customer, quotation reference, value, status, attachments.

## Accounting

### finance_invoices
Invoice number, customer, project, dates, totals, payment status, sync info.

### finance_payments
Payment tracking with partial payment support, method, reference.

### finance_expenses
Expense tracking with categories, projects, receipts.

### finance_bills
Vendor bills with PO reference, payment status.

## Projects

### projects
Full lifecycle from PO received through handover.

### project_tasks
Task management with assignments, dependencies, statuses.

### project_milestones
Key project milestones with dates and completion tracking.

## Key Relationships

```
Company → Contacts (1:N)
Company → Inquiries (1:N)
Inquiry → Opportunity (1:1)
Opportunity → Technical Requirements (1:N)
Opportunity → Site Visits (1:N)
Opportunity → BOQs (1:N)
Opportunity → Quotations (1:N)
Quotation → Quotation Versions (1:N)
Quotation → Purchase Order (1:1)
Purchase Order → Project (1:1)
Project → Tasks (1:N)
Project → Invoices (1:N)
Invoice → Payments (1:N)
```

## Important Constraints

- All monetary fields use DECIMAL type
- Business IDs are unique and auto-generated
- Soft delete via `is_active` / `deleted_at` where appropriate
- All tables have `created_at` and `updated_at` timestamps
- Foreign keys enforce referential integrity
- Idempotency keys prevent duplicate webhook entries
