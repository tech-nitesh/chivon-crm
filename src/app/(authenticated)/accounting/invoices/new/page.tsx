import { redirect } from "next/navigation"

export default function NewInvoiceRedirect() {
  redirect("/accounting/invoices?new=true")
}
