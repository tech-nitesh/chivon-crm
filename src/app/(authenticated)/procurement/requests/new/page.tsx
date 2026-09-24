import { redirect } from "next/navigation"

export default function NewRequestRedirect() {
  redirect("/procurement/requests?new=true")
}
