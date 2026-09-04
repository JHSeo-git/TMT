import { createSearchAPI } from "fumadocs-core/search/server"

import { getSearchServer, searchIndexEntries } from "@/lib/search-index"

/**
 * Raised while the cold cost of the index is being measured on a real deployment. The route was
 * answering `FUNCTION_INVOCATION_TIMEOUT` at the 10s default, and a diagnostic that also times out
 * tells us nothing.
 */
export const maxDuration = 60

export async function GET(request: Request) {
  if (new URL(request.url).searchParams.get("diag") === "1") {
    return diagnose()
  }

  return getSearchServer().GET(request)
}

/**
 * Reports what building the index costs on this machine, which is the thing that cannot be
 * measured locally. Builds over growing slices so the per-item cost is visible even if the full
 * build is hopeless here, and reports memory alongside, since a function whose CPU is metered by
 * its memory allocation may be losing to garbage collection rather than to arithmetic.
 *
 * Temporary. It reports counts and timings only — never item content.
 */
async function diagnose() {
  const started = Date.now()
  const entries = searchIndexEntries
  const chunks = entries.reduce((total, e) => total + e.structuredData.contents.length, 0)

  const phases: { items: number; chunks: number; buildMs: number; rssMb: number }[] = []

  for (const size of [10, 50, 150, entries.length]) {
    const slice = entries.slice(0, size)
    const at = Date.now()
    const api = createSearchAPI("advanced", { indexes: slice })
    await api.search("warmup")
    phases.push({
      items: size,
      chunks: slice.reduce((total, e) => total + e.structuredData.contents.length, 0),
      buildMs: Date.now() - at,
      rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    })

    // Leave room to answer rather than joining the timeouts it is meant to explain.
    if (Date.now() - started > 25_000) {
      break
    }
  }

  return Response.json({
    totalItems: entries.length,
    totalChunks: chunks,
    elapsedMs: Date.now() - started,
    memoryLimitHint: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE ?? null,
    nodeVersion: process.version,
    phases,
  })
}
