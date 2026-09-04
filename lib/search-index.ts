import { structure, type StructuredData } from "fumadocs-core/mdx-plugins/remark-structure"
import { createSearchAPI } from "fumadocs-core/search/server"

import { getAllPublishedItems, type Item } from "./github"

type SearchServer = ReturnType<typeof createSearchAPI>

let server: SearchServer | undefined

/**
 * The search server, built once per process.
 *
 * Building costs around a second and a half for 293 items — `structure()` over every body and then
 * Orama's own index — so a cold instance pays it on its first query and every later query is
 * single-digit milliseconds. Holding it in module scope also means concurrent requests arriving
 * during that build share the one build instead of each starting another.
 */
export function getSearchServer(): SearchServer {
  server ??= createSearchAPI("advanced", { indexes: buildIndexes })
  return server
}

async function buildIndexes() {
  const items = await getAllPublishedItems()
  return items.flatMap(toIndex)
}

function toIndex(item: Item) {
  if (!item.body) {
    return []
  }

  let structured: StructuredData

  try {
    structured = structure(item.body)
  } catch (error) {
    // One item whose Markdown will not parse must not take the whole index down with it.
    console.error(`failed to structure item #${item.number}: `, error)
    return []
  }

  const url = `/i/${item.number}`

  return [
    {
      id: url,
      url,
      title: item.title,
      // Nothing filters by topic yet. The field costs one value and makes `QueryOptions.tag` work
      // the day something does.
      tag: item.topics,
      structuredData: clean(structured),
    },
  ]
}

/**
 * Drops the noise `structure()` leaves behind, all of it observed in its output rather than guessed
 * at: a GFM table is shredded into one chunk per cell, so a three-column table contributes chunks
 * reading `방식`, `오버헤드`, `격리`, and a blockquote keeps its `>` marker inside the text.
 * Single-token chunks are therefore dropped and a leading `>` is stripped. shadcn's own command
 * menu applies the same single-token filter, and tables are why.
 */
function clean(data: StructuredData): StructuredData {
  const seen = new Set<string>()

  return {
    headings: data.headings,
    contents: data.contents
      .map((content) => ({ ...content, content: content.content.replace(/^>\s*/, "").trim() }))
      .filter((content) => {
        if (content.content.split(/\s+/).length <= 1) {
          return false
        }

        if (seen.has(content.content)) {
          return false
        }

        seen.add(content.content)
        return true
      }),
  }
}
