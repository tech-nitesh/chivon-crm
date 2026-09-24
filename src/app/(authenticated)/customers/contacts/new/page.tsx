import { redirect } from "next/navigation"

export default function NewContactRedirect() {
  redirect("/customers/contacts?new=true")
}
