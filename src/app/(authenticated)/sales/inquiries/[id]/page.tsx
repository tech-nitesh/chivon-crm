import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getInquiry } from "../actions"
import { InquiryDetailClient } from "./inquiry-detail-client"

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params
  const inquiry = await getInquiry(id)

  if (!inquiry) {
    notFound()
  }

  // Format dates for client
  const serializedInquiry = {
    ...inquiry,
    createdAt: inquiry.createdAt.toISOString(),
    updatedAt: inquiry.updatedAt.toISOString(),
    activities: inquiry.activities.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
  }

  return (
    <InquiryDetailClient
      inquiry={serializedInquiry}
      permissions={session.user.permissions}
    />
  )
}
