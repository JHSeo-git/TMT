#!/usr/bin/env bun
/**
 * Builds the search index's entries ahead of time.
 *
 * The route used to assemble these per process: three GitHub requests for every published body,
 * then `structure()` over each one, then Orama's own index. Measured locally that was 3.1s + 1.7s
 * before Orama even started, and on a cold Vercel function it ran past the 10s limit and answered
 * `FUNCTION_INVOCATION_TIMEOUT`. Everything up to Orama is deterministic for a given deployment,
 * so it happens here instead and the route is left with the part that cannot be precomputed.
 *
 * Run from the repository root as `bun run search-index`; bun reads `.env` automatically. `--force`
 * regenerates an existing file, which is what `bun run search-index --force` in the `build` script
 * does; without it an existing file is left alone, so starting the dev server does not spend four
 * seconds on GitHub every time. Delete the file or pass the flag to refresh it by hand.
 */
import { mkdir, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import { structure, type StructuredData } from "fumadocs-core/mdx-plugins/remark-structure"

import { getAllPublishedItems, type Item } from "@/lib/github"

const OUT = path.join(process.cwd(), "lib", "search-index.generated.json")

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

function toEntry(item: Item) {
  if (!item.body) {
    return []
  }

  let structured: StructuredData

  try {
    structured = structure(item.body)
  } catch (error) {
    // One item whose Markdown will not parse must not take the whole index down with it.
    console.error(`  skipped #${item.number}: ${String(error)}`)
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

async function exists(file: string) {
  try {
    await stat(file)
    return true
  } catch {
    return false
  }
}

const force = process.argv.includes("--force")

if (!force && (await exists(OUT))) {
  console.log(`search index: ${path.relative(process.cwd(), OUT)} exists, leaving it alone`)
  process.exit(0)
}

const started = Date.now()
const items = await getAllPublishedItems()
const entries = items.flatMap(toEntry)

// An empty index is always a misconfigured token or a renamed publish gate, never the truth.
// Failing the build beats deploying a site that finds nothing.
if (entries.length === 0) {
  console.error(
    "error: no published items to index — check GITHUB_TOKEN, GITHUB_REPO, and the publish gate"
  )
  process.exit(1)
}

const json = JSON.stringify(entries)
await mkdir(path.dirname(OUT), { recursive: true })
await writeFile(OUT, json, "utf8")

const chunks = entries.reduce((total, entry) => total + entry.structuredData.contents.length, 0)
console.log(
  `search index: ${entries.length} items, ${chunks} chunks, ` +
    `${(Buffer.byteLength(json) / 1024 / 1024).toFixed(2)}MB in ${Date.now() - started}ms`
)
