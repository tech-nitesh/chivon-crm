import prisma from "./db"

/**
 * Generate a business ID like CHV-CMP-00001
 * Uses database-backed counter for collision prevention
 */
export async function generateBusinessId(entity: string): Promise<string> {
  const format = await prisma.numberingFormat.upsert({
    where: { entity },
    update: { nextNum: { increment: 1 } },
    create: {
      entity,
      prefix: getPrefix(entity),
      nextNum: 2, // We'll return 1, next call gets 2
      padding: 5,
    },
  })

  // If we just created it, use 1. Otherwise use the value before increment.
  const num = format.nextNum - 1 || 1
  const paddedNum = String(num).padStart(format.padding, "0")
  return `${format.prefix}-${paddedNum}`
}

function getPrefix(entity: string): string {
  const prefixes: Record<string, string> = {
    company: "CHV-CMP",
    contact: "CHV-CON",
    inquiry: "CHV-ENQ",
    opportunity: "CHV-OPP",
    boq: "CHV-BOQ",
    quotation: "CHV-Q",
    purchase_order: "CHV-PO",
    project: "CHV-PRJ",
    invoice: "CHV-INV",
    payment: "CHV-PAY",
    vendor: "CHV-VEN",
    expense: "CHV-EXP",
    bill: "CHV-BIL",
  }
  return prefixes[entity] || `CHV-${entity.toUpperCase().slice(0, 3)}`
}
