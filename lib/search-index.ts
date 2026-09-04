import entries from "./search-index.generated.json"

/**
 * A single searchable row: an item's heading, or a chunk of its text.
 *
 * The shape matches fumadocs' `SortedResult`, which is what its fetch client expects back from
 * `/api/search`. Keeping the wire format lets `useDocsSearch` stay exactly as it was.
 */
export interface SearchHit {
  id: string
  url: string
  type: "heading" | "text"
  content: string
}

interface Row {
  id: string
  url: string
  type: "heading" | "text"
  content: string
  /** Lowercased once, at module load, so a query never lowercases 17,000 strings again. */
  haystack: string
}

/**
 * Every row, flattened at module load.
 *
 * There is no inverted index here, and that is the point. Building one over these 14,208 chunks
 * cost 1,048ms locally, six seconds or so on a Vercel function, and 598MB resident — which on a
 * host that meters CPU by memory allocation is a fight you lose twice. Scanning the rows instead
 * costs 6ms to prepare and under a millisecond to query, in 40MB. An archive of 293 items is small
 * enough that the index was the expensive way to do a cheap thing.
 *
 * What that gives up is Orama's typo tolerance — `샌트박스` no longer finds `샌드박스`. Prefixes
 * still work, because a prefix is a substring.
 */
const rows: Row[] = entries.flatMap((entry) => {
  const out: Row[] = []

  for (const heading of entry.structuredData.headings) {
    out.push({
      id: `${entry.url}#${heading.id}`,
      url: `${entry.url}#${heading.id}`,
      type: "heading",
      content: heading.content,
      haystack: heading.content.toLowerCase(),
    })
  }

  for (const [index, chunk] of entry.structuredData.contents.entries()) {
    const anchor = "heading" in chunk && chunk.heading ? `#${chunk.heading}` : ""

    out.push({
      id: `${entry.url}-${index}`,
      url: `${entry.url}${anchor}`,
      type: "text",
      content: chunk.content,
      haystack: chunk.content.toLowerCase(),
    })
  }

  return out
})

/** How many hits to answer with. The palette renders eight after its own de-duplication. */
const MAX_HITS = 32

/** Wraps each matched run in `<mark>`, which is the highlighting fumadocs used to emit. */
function highlight(content: string, terms: string[]): string {
  let marked = content

  for (const term of terms) {
    const pattern = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")
    marked = marked.replace(pattern, (match) => `<mark>${match}</mark>`)
  }

  return marked
}

/**
 * Rows holding every term, newest item first.
 *
 * Every term rather than any: a chunk carrying both `격리` and `구조` is what someone typing two
 * words is looking for, and ranking a long list of one-term matches is the job an index would be
 * for. The rows arrive newest-first from the generator and keep that order, which is the order the
 * archive itself reads in.
 */
export function searchArchive(query: string): SearchHit[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean)

  if (terms.length === 0) {
    return []
  }

  const hits: SearchHit[] = []
  const seen = new Set<string>()

  for (const row of rows) {
    if (!terms.every((term) => row.haystack.includes(term))) {
      continue
    }

    if (seen.has(row.content)) {
      continue
    }

    seen.add(row.content)
    hits.push({
      id: row.id,
      url: row.url,
      type: row.type,
      content: highlight(row.content, terms),
    })

    if (hits.length === MAX_HITS) {
      break
    }
  }

  return hits
}
