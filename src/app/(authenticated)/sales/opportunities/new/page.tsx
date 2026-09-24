import { redirect } from "next/navigation"

export default function NewOpportunityRedirect() {
  redirect("/sales/opportunities?new=true")
}
