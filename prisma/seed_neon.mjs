import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

function cuid() {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).substring(2, 8);
  return `c${ts}${rnd}`;
}

async function main() {
  console.log("🌱 Seeding Neon PostgreSQL Database with complete Chivon CRM data via HTTP...");

  // 1. PERMISSIONS
  console.log("Creating permissions...");
  const resources = [
    "customers", "inquiries", "opportunities", "quotations", "projects",
    "invoices", "payments", "expenses", "bills", "vendors", "reports",
    "documents", "technical", "admin.users", "admin.roles", "admin.settings", "admin.audit",
  ];
  const actions = ["view", "create", "edit", "delete"];
  const specialPermissions = [
    { resource: "quotations", action: "approve" },
    { resource: "quotations", action: "send" },
    { resource: "inquiries", action: "assign" },
    { resource: "reports", action: "export" },
    { resource: "documents", action: "upload" },
    { resource: "admin.users", action: "manage" },
    { resource: "admin.roles", action: "manage" },
    { resource: "admin.settings", action: "manage" },
  ];

  const allPerms = [];
  for (const r of resources) {
    for (const a of actions) {
      allPerms.push({ resource: r, action: a, slug: `${r}.${a}` });
    }
  }
  for (const sp of specialPermissions) {
    if (!allPerms.find((p) => p.slug === `${sp.resource}.${sp.action}`)) {
      allPerms.push({ resource: sp.resource, action: sp.action, slug: `${sp.resource}.${sp.action}` });
    }
  }

  for (const p of allPerms) {
    const id = cuid();
    await sql`
      INSERT INTO permissions (id, resource, action, slug)
      VALUES (${id}, ${p.resource}, ${p.action}, ${p.slug})
      ON CONFLICT (slug) DO UPDATE SET resource = EXCLUDED.resource
    `;
  }
  console.log(`  ✅ ${allPerms.length} permissions seeded.`);

  // 2. ROLES
  console.log("Creating roles...");
  const roles = [
    { name: "Super Admin", slug: "super_admin", description: "Full system access", isSystem: true },
    { name: "Sales Manager", slug: "sales_manager", description: "Sales leadership", isSystem: false },
    { name: "Sales Representative", slug: "sales_rep", description: "Inquiry and pipeline management", isSystem: false },
    { name: "Technical Lead", slug: "technical_lead", description: "Technical specs, site visits and BOQ", isSystem: false },
    { name: "Commercial Manager", slug: "commercial_manager", description: "Quotation approvals and negotiations", isSystem: false },
    { name: "Finance Manager", slug: "finance_manager", description: "Invoices, banking, and accounting", isSystem: false },
    { name: "Operations Manager", slug: "operations_manager", description: "Turnkey project management", isSystem: false },
  ];

  for (const r of roles) {
    const id = cuid();
    await sql`
      INSERT INTO roles (id, name, slug, description, data_scope, is_system)
      VALUES (${id}, ${r.name}, ${r.slug}, ${r.description}, 'all', ${r.isSystem})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    `;
  }
  console.log(`  ✅ ${roles.length} roles seeded.`);

  // 3. LINK SUPER ADMIN TO ALL PERMISSIONS
  console.log("Linking Super Admin permissions...");
  const [superAdminRole] = await sql`SELECT id FROM roles WHERE slug = 'super_admin' LIMIT 1`;
  const allDbPerms = await sql`SELECT id FROM permissions`;
  for (const p of allDbPerms) {
    await sql`
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (${superAdminRole.id}, ${p.id})
      ON CONFLICT DO NOTHING
    `;
  }
  console.log("  ✅ All permissions granted to Super Admin.");

  // 4. DEPARTMENTS
  console.log("Creating departments...");
  const depts = [
    { name: "Sales & Commercial", code: "SALES" },
    { name: "Technical Engineering", code: "ENG" },
    { name: "Finance & Accounting", code: "FIN" },
    { name: "Operations & Projects", code: "OPS" },
  ];
  for (const d of depts) {
    const id = cuid();
    await sql`
      INSERT INTO departments (id, name, code, is_active)
      VALUES (${id}, ${d.name}, ${d.code}, true)
      ON CONFLICT (name) DO UPDATE SET code = EXCLUDED.code
    `;
  }
  console.log(`  ✅ ${depts.length} departments seeded.`);

  // 5. ADMIN USER
  console.log("Creating Admin user (admin@chivon.com)...");
  const passwordHash = await bcrypt.hash("ChivonAdmin2024!", 10);
  const [salesDept] = await sql`SELECT id FROM departments WHERE code = 'SALES' LIMIT 1`;
  const adminId = cuid();

  const [user] = await sql`
    INSERT INTO users (id, email, password_hash, first_name, last_name, phone, department_id, is_active, updated_at)
    VALUES (${adminId}, 'admin@chivon.com', ${passwordHash}, 'System', 'Administrator', '+971 4 000 0000', ${salesDept?.id || null}, true, NOW())
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
    RETURNING id
  `;

  await sql`
    INSERT INTO user_roles (user_id, role_id)
    VALUES (${user.id}, ${superAdminRole.id})
    ON CONFLICT DO NOTHING
  `;
  console.log("  ✅ Admin user (admin@chivon.com / ChivonAdmin2024!) ready with Super Admin role.");

  // 6. INITIAL COMPANY & CONTACT
  console.log("Creating initial customer data...");
  const compId = cuid();
  await sql`
    INSERT INTO companies (id, business_id, name, industry, email, phone, city, country, is_active, updated_at)
    VALUES (${compId}, 'CMP-001', 'Al Futtaim Engineering', 'Industrial Automation', 'procurement@alfuttaim.ae', '+971 4 213 1111', 'Dubai', 'United Arab Emirates', true, NOW())
    ON CONFLICT DO NOTHING
  `;

  const [company] = await sql`SELECT id FROM companies WHERE business_id = 'CMP-001' LIMIT 1`;
  const contId = cuid();
  await sql`
    INSERT INTO contacts (id, business_id, company_id, first_name, last_name, email, phone, designation, is_primary, is_active, updated_at)
    VALUES (${contId}, 'CON-001', ${company.id}, 'Tariq', 'Mansoor', 'tariq.m@alfuttaim.ae', '+971 50 123 4567', 'Procurement Director', true, true, NOW())
    ON CONFLICT DO NOTHING
  `;

  // 7. INITIAL INQUIRY (LEAD)
  const [contact] = await sql`SELECT id FROM contacts WHERE business_id = 'CON-001' LIMIT 1`;
  const inqId = cuid();
  await sql`
    INSERT INTO inquiries (id, business_id, company_id, contact_id, discipline, scope, location, estimated_value, priority, status, updated_at)
    VALUES (${inqId}, 'INQ-001', ${company.id}, ${contact.id}, 'Instrumentation', 'PLC Automation Panel for Packaging Line 4', 'Dubai Industrial City', 185000, 'high', 'qualified', NOW())
    ON CONFLICT DO NOTHING
  `;

  console.log("\n========================================================");
  console.log("🎉 NEON POSTGRESQL DATABASE SEEDED SUCCESSFULLY!");
  console.log("Database Project: withered-frog-11963850");
  console.log("Admin Email:      admin@chivon.com");
  console.log("Admin Password:   ChivonAdmin2024!");
  console.log("========================================================");
}

main().catch((e) => {
  console.error("Seed error:", e);
  process.exit(1);
});
