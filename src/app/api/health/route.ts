import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    name: "CHIVON CRM",
    timestamp: new Date().toISOString(),
  })
}
