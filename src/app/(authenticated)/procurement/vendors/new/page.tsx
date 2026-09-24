import { redirect } from "next/navigation"

export default function NewVendorRedirect() {
  redirect("/procurement/vendors?new=true")
}
