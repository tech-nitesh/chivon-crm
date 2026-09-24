import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding CHIVON CRM database...")

  // ============================================================
  // 1. PERMISSIONS
  // ============================================================
  const resources = [
    "customers", "inquiries", "opportunities", "quotations", "projects",
    "invoices", "payments", "expenses", "bills", "vendors", "reports",
    "documents", "technical", "admin.users", "admin.roles", "admin.settings",
  ]
  const actions = ["view", "create", "edit", "delete"]
  const specialPermissions = [
    { resource: "quotations", action: "approve" },
    { resource: "quotations", action: "send" },
    { resource: "inquiries", action: "assign" },
    { resource: "reports", action: "export" },
    { resource: "documents", action: "upload" },
    { resource: "admin.users", action: "manage" },
    { resource: "admin.roles", action: "manage" },
    { resource: "admin.settings", action: "manage" },
  ]

  const allPermissions: { resource: string; action: string; slug: string }[] = []
  for (const resource of resources) {
    for (const action of actions) {
      allPermissions.push({ resource, action, slug: `${resource}.${action}` })
    }
  }
  for (const sp of specialPermissions) {
    if (!allPermissions.find((p) => p.slug === `${sp.resource}.${sp.action}`)) {
      allPermissions.push({ resource: sp.resource, action: sp.action, slug: `${sp.resource}.${sp.action}` })
    }
  }

  for (const perm of allPermissions) {
    await prisma.permission.upsert({
      where: { slug: perm.slug },
      update: {},
      create: perm,
    })
  }
  console.log(`  ✅ ${allPermissions.length} permissions created`)

  // ============================================================
  // 2. ROLES
  // ============================================================
  const allPerms = await prisma.permission.findMany()
  const permMap = new Map(allPerms.map((p) => [p.slug, p.id]))

  const roles = [
    {
      name: "Super Admin",
      slug: "super_admin",
      description: "Full system access",
      dataScope: "all",
      isSystem: true,
      permissions: allPerms.map((p) => p.id),
    },
    {
      name: "Director",
      slug: "director",
      description: "Executive oversight of all operations",
      dataScope: "all",
      isSystem: true,
      permissions: allPerms.map((p) => p.id),
    },
    {
      name: "Sales Manager",
      slug: "sales_manager",
      description: "Manages sales team and pipeline",
      dataScope: "team",
      isSystem: false,
      permissions: [
        "customers.view", "customers.create", "customers.edit",
        "inquiries.view", "inquiries.create", "inquiries.edit", "inquiries.assign",
        "opportunities.view", "opportunities.create", "opportunities.edit",
        "quotations.view", "quotations.create", "quotations.edit", "quotations.send",
        "projects.view",
        "invoices.view",
        "reports.view", "reports.export",
        "documents.view", "documents.upload",
        "technical.view",
      ].map((slug) => permMap.get(slug)!).filter(Boolean),
    },
    {
      name: "Sales Executive",
      slug: "sales_executive",
      description: "Handles individual sales activities",
      dataScope: "own",
      isSystem: false,
      permissions: [
        "customers.view", "customers.create", "customers.edit",
        "inquiries.view", "inquiries.create", "inquiries.edit",
        "opportunities.view", "opportunities.create", "opportunities.edit",
        "quotations.view", "quotations.create", "quotations.edit",
        "projects.view",
        "documents.view", "documents.upload",
        "technical.view",
      ].map((slug) => permMap.get(slug)!).filter(Boolean),
    },
    {
      name: "Technical Manager",
      slug: "technical_manager",
      description: "Manages technical team and requirements",
      dataScope: "department",
      isSystem: false,
      permissions: [
        "customers.view",
        "inquiries.view",
        "opportunities.view",
        "quotations.view",
        "projects.view", "projects.edit",
        "technical.view", "technical.create", "technical.edit",
        "documents.view", "documents.upload",
        "reports.view",
      ].map((slug) => permMap.get(slug)!).filter(Boolean),
    },
    {
      name: "Finance",
      slug: "finance",
      description: "Financial operations and accounting",
      dataScope: "all",
      isSystem: false,
      permissions: [
        "customers.view",
        "invoices.view", "invoices.create", "invoices.edit",
        "payments.view", "payments.create",
        "expenses.view", "expenses.create", "expenses.edit",
        "bills.view", "bills.create", "bills.edit",
        "reports.view", "reports.export",
        "documents.view",
        "projects.view",
        "quotations.view",
      ].map((slug) => permMap.get(slug)!).filter(Boolean),
    },
    {
      name: "Project Manager",
      slug: "project_manager",
      description: "Manages project execution",
      dataScope: "own",
      isSystem: false,
      permissions: [
        "customers.view",
        "projects.view", "projects.create", "projects.edit",
        "vendors.view",
        "documents.view", "documents.upload",
        "invoices.view",
        "technical.view",
        "reports.view",
      ].map((slug) => permMap.get(slug)!).filter(Boolean),
    },
    {
      name: "Viewer",
      slug: "viewer",
      description: "Read-only access",
      dataScope: "all",
      isSystem: true,
      permissions: [
        "customers.view",
        "inquiries.view",
        "opportunities.view",
        "quotations.view",
        "projects.view",
        "invoices.view",
        "reports.view",
        "documents.view",
        "technical.view",
      ].map((slug) => permMap.get(slug)!).filter(Boolean),
    },
  ]

  for (const roleData of roles) {
    const { permissions, ...roleFields } = roleData
    const role = await prisma.role.upsert({
      where: { slug: roleFields.slug },
      update: {},
      create: roleFields,
    })
    // Set permissions
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })
    for (const permId of permissions) {
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId: permId },
      })
    }
  }
  console.log(`  ✅ ${roles.length} roles created`)

  // ============================================================
  // 3. DEPARTMENTS
  // ============================================================
  const departments = [
    { name: "Sales", code: "SALES" },
    { name: "Technical", code: "TECH" },
    { name: "Projects", code: "PROJ" },
    { name: "Finance", code: "FIN" },
    { name: "Procurement", code: "PROC" },
    { name: "Management", code: "MGMT" },
  ]

  const deptMap: Record<string, string> = {}
  for (const dept of departments) {
    const d = await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    })
    deptMap[dept.code] = d.id
  }
  console.log(`  ✅ ${departments.length} departments created`)

  // ============================================================
  // 4. SERVICE CATEGORIES & SERVICES
  // ============================================================
  const categories = [
    { name: "Automation & Controls" },
    { name: "Fabrication & Welding" },
    { name: "CNC Machining" },
    { name: "Electrical" },
    { name: "Maintenance" },
  ]

  const catMap: Record<string, string> = {}
  for (const cat of categories) {
    const c = await prisma.serviceCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
    catMap[cat.name] = c.id
  }

  const services = [
    { name: "PLC Programming", categoryId: catMap["Automation & Controls"] },
    { name: "SCADA Systems", categoryId: catMap["Automation & Controls"] },
    { name: "VFD Installation", categoryId: catMap["Automation & Controls"] },
    { name: "HMI Development", categoryId: catMap["Automation & Controls"] },
    { name: "Panel Fabrication", categoryId: catMap["Fabrication & Welding"] },
    { name: "Structural Steel", categoryId: catMap["Fabrication & Welding"] },
    { name: "Pipe Fabrication", categoryId: catMap["Fabrication & Welding"] },
    { name: "CNC Turning", categoryId: catMap["CNC Machining"] },
    { name: "CNC Milling", categoryId: catMap["CNC Machining"] },
    { name: "5-Axis Machining", categoryId: catMap["CNC Machining"] },
    { name: "Electrical Wiring", categoryId: catMap["Electrical"] },
    { name: "Preventive Maintenance", categoryId: catMap["Maintenance"] },
  ]

  for (const svc of services) {
    await prisma.service.upsert({
      where: { id: svc.name },
      update: {},
      create: svc,
    })
  }
  console.log(`  ✅ ${services.length} services created`)

  // ============================================================
  // 5. TAX RATES
  // ============================================================
  await prisma.taxRate.upsert({
    where: { id: "vat5" },
    update: {},
    create: { id: "vat5", name: "VAT 5%", rate: 5.0, type: "both", isDefault: true },
  })
  await prisma.taxRate.upsert({
    where: { id: "vat0" },
    update: {},
    create: { id: "vat0", name: "Zero Rated", rate: 0, type: "both" },
  })
  console.log("  ✅ Tax rates created")

  // ============================================================
  // 6. NUMBERING FORMATS
  // ============================================================
  const numberFormats = [
    { entity: "company", prefix: "CHV-CMP", nextNum: 1, padding: 5 },
    { entity: "contact", prefix: "CHV-CON", nextNum: 1, padding: 5 },
    { entity: "inquiry", prefix: "CHV-ENQ", nextNum: 1, padding: 5 },
    { entity: "opportunity", prefix: "CHV-OPP", nextNum: 1, padding: 5 },
    { entity: "boq", prefix: "CHV-BOQ", nextNum: 1, padding: 5 },
    { entity: "quotation", prefix: "CHV-Q", nextNum: 1, padding: 5 },
    { entity: "purchase_order", prefix: "CHV-PO", nextNum: 1, padding: 5 },
    { entity: "project", prefix: "CHV-PRJ", nextNum: 1, padding: 5 },
    { entity: "invoice", prefix: "CHV-INV", nextNum: 1, padding: 5 },
    { entity: "payment", prefix: "CHV-PAY", nextNum: 1, padding: 5 },
    { entity: "vendor", prefix: "CHV-VEN", nextNum: 1, padding: 5 },
    { entity: "expense", prefix: "CHV-EXP", nextNum: 1, padding: 5 },
    { entity: "bill", prefix: "CHV-BIL", nextNum: 1, padding: 5 },
  ]
  for (const nf of numberFormats) {
    await prisma.numberingFormat.upsert({
      where: { entity: nf.entity },
      update: {},
      create: nf,
    })
  }
  console.log("  ✅ Numbering formats created")

  // ============================================================
  // 7. USERS
  // ============================================================
  const passwordHash = await hash("ChivonAdmin2024!", 12)

  const usersData = [
    { email: "admin@chivon.com", firstName: "Admin", lastName: "User", role: "super_admin", dept: "MGMT" },
    { email: "director@chivon.com", firstName: "Khalid", lastName: "Al Mansoori", role: "director", dept: "MGMT" },
    { email: "sales.mgr@chivon.com", firstName: "Ahmed", lastName: "Hassan", role: "sales_manager", dept: "SALES" },
    { email: "sales@chivon.com", firstName: "Fatima", lastName: "Ibrahim", role: "sales_executive", dept: "SALES" },
    { email: "sales2@chivon.com", firstName: "Omar", lastName: "Khalil", role: "sales_executive", dept: "SALES" },
    { email: "tech.mgr@chivon.com", firstName: "Ravi", lastName: "Patel", role: "technical_manager", dept: "TECH" },
    { email: "engineer@chivon.com", firstName: "Suresh", lastName: "Kumar", role: "technical_manager", dept: "TECH" },
    { email: "finance@chivon.com", firstName: "Sara", lastName: "Mohammed", role: "finance", dept: "FIN" },
    { email: "pm@chivon.com", firstName: "Ali", lastName: "Rashid", role: "project_manager", dept: "PROJ" },
  ]

  const userMap: Record<string, string> = {}
  for (const userData of usersData) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        departmentId: deptMap[userData.dept],
        isActive: true,
      },
    })
    userMap[userData.email] = user.id

    // Assign role
    const role = await prisma.role.findUnique({ where: { slug: userData.role } })
    if (role) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: { userId: user.id, roleId: role.id },
      })
    }
  }
  console.log(`  ✅ ${usersData.length} users created`)

  // ============================================================
  // 8. SEED COMPANIES
  // ============================================================
  const companies = [
    { name: "Emirates Steel Industries", industry: "Steel Manufacturing", city: "Abu Dhabi", country: "UAE", email: "procurement@emiratessteel.ae", phone: "+971-2-509-1111" },
    { name: "ADNOC Refining", industry: "Oil & Gas", city: "Abu Dhabi", country: "UAE", email: "projects@adnoc.ae", phone: "+971-2-602-0000" },
    { name: "Dubai Municipality", industry: "Government", city: "Dubai", country: "UAE", email: "tenders@dm.gov.ae", phone: "+971-4-221-5555" },
    { name: "Al Ghurair Iron & Steel", industry: "Steel Manufacturing", city: "Dubai", country: "UAE", email: "info@alghurair.com", phone: "+971-4-269-3333" },
    { name: "Sharjah Cement Factory", industry: "Cement & Building Materials", city: "Sharjah", country: "UAE", email: "eng@sharjahcement.com", phone: "+971-6-534-1234" },
    { name: "National Petroleum Construction", industry: "Oil & Gas Construction", city: "Abu Dhabi", country: "UAE", email: "procurement@npcc.ae", phone: "+971-2-673-4567" },
    { name: "Dubai Aluminium (DUBAL)", industry: "Aluminium Smelting", city: "Dubai", country: "UAE", email: "maintenance@dubal.ae", phone: "+971-4-880-6789" },
    { name: "Ras Al Khaimah Ceramics", industry: "Ceramics Manufacturing", city: "Ras Al Khaimah", country: "UAE", email: "projects@rakceram.com", phone: "+971-7-244-9876" },
  ]

  const companyMap: Record<string, string> = {}
  let companyNum = 1
  for (const comp of companies) {
    const businessId = `CHV-CMP-${String(companyNum++).padStart(5, "0")}`
    const c = await prisma.company.upsert({
      where: { businessId },
      update: {},
      create: {
        ...comp,
        businessId,
        ownerId: userMap["sales@chivon.com"],
      },
    })
    companyMap[comp.name] = c.id
  }
  // Update numbering counter
  await prisma.numberingFormat.update({
    where: { entity: "company" },
    data: { nextNum: companyNum },
  })
  console.log(`  ✅ ${companies.length} companies created`)

  // ============================================================
  // 9. SEED CONTACTS
  // ============================================================
  const contacts = [
    { companyName: "Emirates Steel Industries", firstName: "Mohammed", lastName: "Al Hashimi", designation: "Procurement Manager", email: "m.hashimi@emiratessteel.ae", phone: "+971-50-123-4001", isPrimary: true, isDecisionMaker: true },
    { companyName: "Emirates Steel Industries", firstName: "Aisha", lastName: "Al Mazrouei", designation: "Engineering Lead", email: "a.mazrouei@emiratessteel.ae", phone: "+971-50-123-4002" },
    { companyName: "ADNOC Refining", firstName: "Sultan", lastName: "Al Dhaheri", designation: "Projects Director", email: "s.dhaheri@adnoc.ae", phone: "+971-50-123-4003", isPrimary: true, isDecisionMaker: true },
    { companyName: "ADNOC Refining", firstName: "Layla", lastName: "Al Shamsi", designation: "Maintenance Supervisor", email: "l.shamsi@adnoc.ae", phone: "+971-50-123-4004" },
    { companyName: "Dubai Municipality", firstName: "Hamad", lastName: "Al Falasi", designation: "Senior Engineer", email: "h.falasi@dm.gov.ae", phone: "+971-50-123-4005", isPrimary: true },
    { companyName: "Al Ghurair Iron & Steel", firstName: "Khalfan", lastName: "Al Mulla", designation: "Plant Manager", email: "k.mulla@alghurair.com", phone: "+971-50-123-4006", isPrimary: true, isDecisionMaker: true },
    { companyName: "Sharjah Cement Factory", firstName: "Nasser", lastName: "Al Ketbi", designation: "Automation Engineer", email: "n.ketbi@sharjahcement.com", phone: "+971-50-123-4007", isPrimary: true },
    { companyName: "National Petroleum Construction", firstName: "Youssef", lastName: "Al Muhairi", designation: "Contract Engineer", email: "y.muhairi@npcc.ae", phone: "+971-50-123-4008", isPrimary: true },
    { companyName: "Dubai Aluminium (DUBAL)", firstName: "Maryam", lastName: "Al Suwaidi", designation: "Maintenance Manager", email: "m.suwaidi@dubal.ae", phone: "+971-50-123-4009", isPrimary: true, isDecisionMaker: true },
    { companyName: "Ras Al Khaimah Ceramics", firstName: "Abdulla", lastName: "Al Nuaimi", designation: "Production Engineer", email: "a.nuaimi@rakceram.com", phone: "+971-50-123-4010", isPrimary: true },
  ]

  let contactNum = 1
  for (const contact of contacts) {
    const businessId = `CHV-CON-${String(contactNum++).padStart(5, "0")}`
    const { companyName, ...contactData } = contact
    await prisma.contact.upsert({
      where: { businessId },
      update: {},
      create: {
        ...contactData,
        businessId,
        companyId: companyMap[companyName],
        isPrimary: contact.isPrimary || false,
        isDecisionMaker: contact.isDecisionMaker || false,
      },
    })
  }
  await prisma.numberingFormat.update({
    where: { entity: "contact" },
    data: { nextNum: contactNum },
  })
  console.log(`  ✅ ${contacts.length} contacts created`)

  // ============================================================
  // 10. SEED INQUIRIES
  // ============================================================
  const servicesList = await prisma.service.findMany()
  const inquiriesData = [
    { companyName: "Emirates Steel Industries", scope: "SCADA system upgrade for hot rolling mill", source: "email", priority: "high", estimatedValue: 450000, status: "qualified" },
    { companyName: "Emirates Steel Industries", scope: "Control panel fabrication for cooling tower", source: "phone", priority: "medium", estimatedValue: 120000, status: "new" },
    { companyName: "ADNOC Refining", scope: "PLC migration from legacy to Siemens S7-1500", source: "tender", priority: "high", estimatedValue: 780000, status: "converted" },
    { companyName: "Dubai Municipality", scope: "Water treatment plant automation", source: "website", priority: "medium", estimatedValue: 350000, status: "qualified" },
    { companyName: "Al Ghurair Iron & Steel", scope: "VFD installation for conveyor system", source: "referral", priority: "high", estimatedValue: 95000, status: "qualified" },
    { companyName: "Sharjah Cement Factory", scope: "Kiln temperature monitoring system", source: "exhibition", priority: "medium", estimatedValue: 230000, status: "new" },
    { companyName: "National Petroleum Construction", scope: "Pipe spool fabrication - offshore platform", source: "tender", priority: "urgent", estimatedValue: 560000, status: "in_review" },
    { companyName: "Dubai Aluminium (DUBAL)", scope: "Preventive maintenance contract - pot line VFDs", source: "existing_customer", priority: "medium", estimatedValue: 180000, status: "qualified" },
    { companyName: "Ras Al Khaimah Ceramics", scope: "CNC machining of replacement parts", source: "phone", priority: "high", estimatedValue: 45000, status: "new" },
    { companyName: "ADNOC Refining", scope: "Fire & Gas detection system upgrade", source: "email", priority: "urgent", estimatedValue: 920000, status: "in_review" },
  ]

  let inquiryNum = 1
  for (const inq of inquiriesData) {
    const businessId = `CHV-ENQ-${String(inquiryNum++).padStart(5, "0")}`
    await prisma.inquiry.upsert({
      where: { businessId },
      update: {},
      create: {
        businessId,
        companyId: companyMap[inq.companyName],
        scope: inq.scope,
        source: inq.source,
        priority: inq.priority,
        estimatedValue: inq.estimatedValue,
        status: inq.status,
        salespersonId: userMap["sales@chivon.com"],
        serviceId: servicesList[Math.floor(Math.random() * servicesList.length)]?.id,
      },
    })
  }
  await prisma.numberingFormat.update({
    where: { entity: "inquiry" },
    data: { nextNum: inquiryNum },
  })
  console.log(`  ✅ ${inquiriesData.length} inquiries created`)

  // ============================================================
  // 11. SEED OPPORTUNITIES
  // ============================================================
  const oppsData = [
    { companyName: "ADNOC Refining", title: "PLC Migration Project", stage: "quotation", value: 780000, probability: 60 },
    { companyName: "Emirates Steel Industries", title: "SCADA Upgrade - Hot Rolling", stage: "technical", value: 450000, probability: 40 },
    { companyName: "Al Ghurair Iron & Steel", title: "Conveyor VFD Installation", stage: "negotiation", value: 95000, probability: 75 },
    { companyName: "Dubai Municipality", title: "Water Treatment Automation", stage: "qualified", value: 350000, probability: 20 },
    { companyName: "Dubai Aluminium (DUBAL)", title: "VFD Maintenance Contract", stage: "awaiting_po", value: 180000, probability: 90 },
  ]

  let oppNum = 1
  for (const opp of oppsData) {
    const businessId = `CHV-OPP-${String(oppNum++).padStart(5, "0")}`
    await prisma.opportunity.upsert({
      where: { businessId },
      update: {},
      create: {
        businessId,
        companyId: companyMap[opp.companyName],
        title: opp.title,
        stage: opp.stage,
        estimatedValue: opp.value,
        probability: opp.probability,
        ownerId: userMap["sales@chivon.com"],
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })
  }
  await prisma.numberingFormat.update({
    where: { entity: "opportunity" },
    data: { nextNum: oppNum },
  })
  console.log(`  ✅ ${oppsData.length} opportunities created`)

  // ============================================================
  // 12. SEED VENDORS
  // ============================================================
  const vendorsData = [
    { name: "Siemens UAE", contactName: "Hans Muller", email: "sales@siemens-me.com", products: "PLCs, SCADA, HMI, VFDs" },
    { name: "ABB Trading", contactName: "Erik Johansson", email: "industrial@abb-me.com", products: "Drives, Motors, Switches" },
    { name: "Al Masaood Power", contactName: "Tariq Al Ameri", email: "power@masaood.com", products: "Generators, Transformers" },
    { name: "Gulf Fasteners", contactName: "Rajesh Sharma", email: "sales@gulffast.ae", products: "Fasteners, Structural Steel" },
    { name: "National Instruments ME", contactName: "Alex Chen", email: "sales@ni-me.com", products: "DAQ, Test Equipment" },
  ]

  let vendorNum = 1
  for (const v of vendorsData) {
    const businessId = `CHV-VEN-${String(vendorNum++).padStart(5, "0")}`
    await prisma.vendor.upsert({
      where: { businessId },
      update: {},
      create: { ...v, businessId, country: "UAE" },
    })
  }
  await prisma.numberingFormat.update({
    where: { entity: "vendor" },
    data: { nextNum: vendorNum },
  })
  console.log(`  ✅ ${vendorsData.length} vendors created`)

  // ============================================================
  // 13. TECHNICAL TEMPLATES
  // ============================================================
  const templates = [
    {
      serviceType: "plc_automation",
      name: "PLC / Automation",
      fields: JSON.stringify([
        { name: "existing_plc", label: "Existing PLC", type: "text" },
        { name: "proposed_plc", label: "Proposed PLC", type: "text" },
        { name: "brand", label: "Brand", type: "select", options: ["Siemens", "Allen-Bradley", "Schneider", "ABB", "Mitsubishi"] },
        { name: "di_count", label: "Digital Inputs (DI)", type: "number" },
        { name: "do_count", label: "Digital Outputs (DO)", type: "number" },
        { name: "ai_count", label: "Analog Inputs (AI)", type: "number" },
        { name: "ao_count", label: "Analog Outputs (AO)", type: "number" },
        { name: "hmi_required", label: "HMI Required", type: "boolean" },
        { name: "scada_required", label: "SCADA Required", type: "boolean" },
        { name: "vfd_count", label: "Number of VFDs", type: "number" },
        { name: "communication", label: "Communication Protocol", type: "select", options: ["Profinet", "EtherNet/IP", "Modbus TCP", "PROFIBUS", "DeviceNet"] },
        { name: "panel_modification", label: "Panel Modification Required", type: "boolean" },
      ]),
    },
    {
      serviceType: "fabrication",
      name: "Fabrication",
      fields: JSON.stringify([
        { name: "material", label: "Material", type: "select", options: ["Carbon Steel", "Stainless Steel 304", "Stainless Steel 316", "Aluminium", "Duplex"] },
        { name: "thickness", label: "Thickness (mm)", type: "number" },
        { name: "dimensions", label: "Dimensions", type: "text" },
        { name: "quantity", label: "Quantity", type: "number" },
        { name: "welding_standard", label: "Welding Standard", type: "select", options: ["AWS D1.1", "ASME IX", "EN ISO 5817"] },
        { name: "drawings_available", label: "Drawings Available", type: "boolean" },
        { name: "inspection_required", label: "Third-Party Inspection", type: "boolean" },
      ]),
    },
    {
      serviceType: "cnc_machining",
      name: "CNC Machining",
      fields: JSON.stringify([
        { name: "material", label: "Material", type: "text" },
        { name: "drawing_number", label: "Drawing Number", type: "text" },
        { name: "tolerance", label: "Tolerance", type: "text" },
        { name: "quantity", label: "Quantity", type: "number" },
        { name: "turning", label: "Turning Required", type: "boolean" },
        { name: "milling", label: "Milling Required", type: "boolean" },
        { name: "five_axis", label: "5-Axis Required", type: "boolean" },
        { name: "surface_finish", label: "Surface Finish", type: "text" },
      ]),
    },
  ]

  for (const tmpl of templates) {
    await prisma.technicalTemplate.upsert({
      where: { serviceType: tmpl.serviceType },
      update: {},
      create: tmpl,
    })
  }
  console.log(`  ✅ ${templates.length} technical templates created`)

  // ============================================================
  // 14. SEED ACTIVITIES
  // ============================================================
  const activitiesData = [
    { type: "call", subject: "Initial discussion - SCADA requirements", companyName: "Emirates Steel Industries" },
    { type: "meeting", subject: "Technical presentation to ADNOC team", companyName: "ADNOC Refining" },
    { type: "email", subject: "Sent preliminary quotation", companyName: "Al Ghurair Iron & Steel" },
    { type: "note", subject: "Customer requested revised delivery schedule", companyName: "Dubai Municipality" },
    { type: "call", subject: "Follow-up on maintenance contract renewal", companyName: "Dubai Aluminium (DUBAL)" },
  ]

  for (const act of activitiesData) {
    await prisma.activity.create({
      data: {
        type: act.type,
        subject: act.subject,
        companyId: companyMap[act.companyName],
        userId: userMap["sales@chivon.com"],
        status: "completed",
        completedAt: new Date(),
      },
    })
  }
  console.log(`  ✅ ${activitiesData.length} activities created`)

  // ============================================================
  // 15. SEED FOLLOW-UPS
  // ============================================================
  const followUpsData = [
    { companyName: "Emirates Steel Industries", action: "Send revised SCADA proposal", dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), priority: "high" },
    { companyName: "ADNOC Refining", action: "Schedule technical presentation", dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), priority: "urgent", status: "overdue" },
    { companyName: "Al Ghurair Iron & Steel", action: "Check VFD delivery timeline with Siemens", dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), priority: "medium" },
    { companyName: "Sharjah Cement Factory", action: "Follow up on quotation feedback", dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), priority: "medium" },
  ]

  for (const fu of followUpsData) {
    await prisma.followUp.create({
      data: {
        companyId: companyMap[fu.companyName],
        action: fu.action,
        ownerId: userMap["sales@chivon.com"],
        dueDate: fu.dueDate,
        priority: fu.priority,
        status: fu.status || "pending",
      },
    })
  }
  console.log(`  ✅ ${followUpsData.length} follow-ups created`)

  console.log("\n✅ Seed completed successfully!")
  console.log("\nDefault login: admin@chivon.com / ChivonAdmin2024!")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
