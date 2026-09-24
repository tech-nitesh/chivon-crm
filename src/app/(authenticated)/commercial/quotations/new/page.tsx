import { redirect } from "next/navigation"

export default function NewQuotationRedirect() {
  redirect("/commercial/quotations?new=true")
}
