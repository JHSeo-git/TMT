import { searchArchive } from "@/lib/search-index"

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("query") ?? ""

  return Response.json(searchArchive(query))
}
