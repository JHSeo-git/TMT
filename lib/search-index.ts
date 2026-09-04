import { createSearchAPI, type AdvancedIndex } from "fumadocs-core/search/server"

import entries from "./search-index.generated.json"

type SearchServer = ReturnType<typeof createSearchAPI>

let server: SearchServer | undefined

/**
 * The search server, built once per process.
 *
 * The entries come from `scripts/generate-search-index.ts`, which runs before `next build`. That
 * matters rather than merely tidying: assembling them here meant three GitHub requests and
 * `structure()` over 293 bodies on every cold start, which measured 4.8s before Orama began and
 * ran past Vercel's 10s function limit in production. What is left is Orama's own index, which
 * depends on nothing but these entries and so is all that a cold instance now pays for.
 */
export function getSearchServer(): SearchServer {
  /*
   * The cast covers one thing JSON cannot express. `StructuredDataContent` requires a `heading`
   * key that may hold `undefined`, and `JSON.stringify` drops a key whose value is `undefined`
   * rather than writing it, so chunks that sit above the first heading come back without the key
   * at all. Reading `content.heading` gives `undefined` either way; only the type can tell the
   * difference.
   */
  server ??= createSearchAPI("advanced", { indexes: entries as AdvancedIndex[] })
  return server
}
