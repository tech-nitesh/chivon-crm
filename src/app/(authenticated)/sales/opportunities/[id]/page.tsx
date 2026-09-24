import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getOpportunity } from "../actions"
import { OpportunityDetailClient } from "./opportunity-detail-client"

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params
  const opportunity = await getOpportunity(id)

  if (!opportunity) {
    notFound()
  }

  // Serialize dates for client
  const serializedOpportunity = {
    ...opportunity,
    createdAt: opportunity.createdAt.toISOString(),
    updatedAt: opportunity.updatedAt.toISOString(),
    expectedCloseDate: opportunity.expectedCloseDate ? opportunity.expectedCloseDate.toISOString() : null,
    inquiry: opportunity.inquiry
      ? {
          ...opportunity.inquiry,
          createdAt: opportunity.inquiry.createdAt.toISOString(),
        }
      : null,
    technicalRequirements: opportunity.technicalRequirements.map((tr) => ({
      ...tr,
      createdAt: tr.createdAt.toISOString(),
    })),
    siteVisits: opportunity.siteVisits.map((sv) => ({
      ...sv,
      visitDate: sv.visitDate.toISOString(),
      createdAt: sv.createdAt.toISOString(),
    })),
    boqs: opportunity.boqs.map((b) => ({
      ...b,
      createdAt: b.createdAt.toISOString(),
    })),
    quotations: opportunity.quotations.map((q) => ({
      ...q,
      createdAt: q.createdAt.toISOString(),
    })),
    negotiations: opportunity.negotiations.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
    activities: opportunity.activities.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
  }

  return (
    <OpportunityDetailClient
      opportunity={serializedOpportunity}
      permissions={session.user.permissions}
    />
  )
}
