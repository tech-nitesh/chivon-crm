import { redirect } from "next/navigation"

export default function NewInquiryRedirect() {
  redirect("/sales/inquiries?new=true")
}
