import { getSearchServer } from "@/lib/search-index"

export async function GET(request: Request) {
  return getSearchServer().GET(request)
}
