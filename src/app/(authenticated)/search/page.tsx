import { performGlobalSearch } from "./actions"
import { SearchClient } from "./search-client"

export const metadata = {
  title: "Search | Chivon CRM",
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams
  const results = await performGlobalSearch(q)

  return <SearchClient initialQuery={q} initialResults={results} />
}
