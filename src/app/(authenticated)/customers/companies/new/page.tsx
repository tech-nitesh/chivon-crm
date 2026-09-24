import { redirect } from "next/navigation"

export default function NewCompanyRedirect() {
  redirect("/customers/companies?new=true")
}
