# Site search

Search over the archive, opened with `⌘K`. Two things happen at once when the palette opens: the
293 published items are already on the client as titles and dates and filter as you type, and a
request goes out for full-text results that come back pointing at a heading inside an item. The
first tier answers "which item was that", the second answers "where did I read that sentence".

Everything below was measured on 2026-09-04 against the live site's own content — fifteen real
items, average 8,306 characters of body and eleven headings each.

## What the numbers rule out

| | Measured | Consequence |
| --- | --- | --- |
| Serialized advanced index, 293 items | 27MB, 7MB gzipped | Too large for the browser, and too slow to rebuild per request |
| Orama index build, 293 items | 1,048ms and 598MB resident | Why there is no index at all now |
| Warm query | 1–5ms against the real archive, by term | Once built, the route is not the bottleneck |
| Cold query, end to end | 46ms scanning the baked rows | Building an index per process ran past Vercel's 10s limit |
| Index process RSS | 413MB | Function memory is a thing to watch after deploy |
| Titles, 293 items | 24KB, 7KB gzipped, as served | Cheap enough to send with every page |
| Body text capped at 2,000 chars | 1.5MB / 330KB gzipped | A trimmed static index is possible but gives up full-text |

The first row is the whole reason the search runs on the server, and the last row is the reason it
is not worth trying to avoid that. The fifth row is the reason there is a first tier at all.

## Two tiers

The first tier costs nothing extra. Once the list at `/` renders all 293 items, their titles are
already in the HTML; the palette receives the same array from `app/layout.tsx` so it works on item
pages too, at 7KB gzipped per page — 24KB raw, measured against the deployed build of the same
item. It carries a number and a title and nothing else; the dates the rows used to show cost
2.5KB gzipped on every page and told you nothing you were searching for. Filtering is exact and
instant, which is what finding a known item wants.

Putting it in the layout has one cost worth naming, because getting it wrong is expensive rather
than merely untidy. `app/layout.tsx` is currently a synchronous component with no fetch in it, and
a layout renders once per route, so awaiting the item list there means the fetch runs for every one
of the ~298 prerendered pages — three GitHub requests each, near 900 for a build that needs three.
So `getAllPublishedItems` memoises its promise at module scope. That is a requirement of this
design, not an optimisation; Next builds across several workers, so the result is a handful of
fetches rather than one, and still nowhere near the hourly limit of 5,000. The alternative, if
7KB on every page ever becomes the thing to cut, is a generated static JSON the palette fetches
when it first opens, which trades an instant first tier on first open for zero page weight.

The second tier is `useDocsSearch({ type: "fetch", delayMs: 200 })` against `/api/search`. The
hook keeps the typed value in `search` and debounces only the request behind it, so titles filter
on the keystroke while the round trip waits — wrapping it in an effect and a timer of one's own
just adds a second debounce on top. Results arrive as `SortedResult` — `type` is `page`, `heading`,
or `text`, `content` carries its own `<mark />` highlighting as Markdown, and `url` already
includes the heading anchor. `FetchOptions` takes a `cache` map, so retyping a query costs no round
trip.

The tiers overlap deliberately at the edges. `샌드박스` does not match the title `AI 에이전트
샌드박싱` by exact filtering, and it would not match under any client-side filter, but Orama's
tokenizer catches it along with prefixes (`샌드`) and typos (`샌트박스`). What tier one cannot see,
tier two generally can.

## fumadocs without its source loader

The items are GitHub issues, not MDX files, so there is no `fumadocs-mdx` build and no `source`
loader to hand to `createFromSource`. None is needed. `fumadocs-core` exports `createSearchAPI`
directly, and its `indexes` option takes either an array or a function returning one, which is the
seam `createFromSource` itself is built on. Nothing about the search depends on how the content is
stored.

Korean needs no configuration. The tokenizer defaults to `multilingual` in `fumadocs-core@16.15.4`
and the `language` and `localeMap` options are marked deprecated as "no longer needed"; that was
checked rather than taken on trust, and `샌드박스`, `에이전트 격리`, `마이크로VM`, and `펠리컨`
all resolve correctly with no tokenizer package installed. `@orama/orama@3.1.18` is already in the
tree as a dependency of fumadocs, so the search adds no package of its own.

## Assembling the index

`lib/search-index.ts` turns items into `AdvancedIndex` entries — `id`, `title`, `url`, `tag`, and
`structuredData` from `structure()` in `fumadocs-core/mdx-plugins/remark-structure`. Heading slugs
come out of github-slugger on both sides, so a result's `#격리-구조` matches the anchor the item
page's heading rail already renders.

`structure()` needs cleaning up after, for reasons that are visible in its output rather than
guessed at. A GFM table is shredded into one chunk per cell, so a three-column table contributes
chunks reading `방식`, `오버헤드`, `격리`; a blockquote keeps its `>` marker inside the text; and a
fenced code block produces no chunk at all. So single-token `text` chunks are dropped and a leading
`>` is stripped. This is the same filter shadcn's own command menu applies —
`content.trim().split(/\s+/).length <= 1` — and the tables are why it exists.

The assembled server is held in a module-scoped promise, so an instance builds it once and
concurrent requests during those 1.70s share the one build. Assembly refuses to produce an empty
index: zero items means a bad token or a renamed label, and failing the build is better than
deploying a site that finds nothing. A single item whose body fails to parse is dropped from the
index rather than taking the index down with it.

`topic/` labels ride along in `tag`, which makes `QueryOptions.tag` work — `격리` filtered to
`topic/agents` returns 23 of 32 results. No UI uses it yet. It costs one field to keep the
capability and revives the display-name mapping in `lib/labels.ts` that has been dormant since ADR
0002.

## The route

`app/api/search/route.ts` reads the query and scans. There is no inverted index, and that is the
point.

Building one was the first two attempts and both failed on the deployment. Assembling the entries
inside the route — three GitHub requests, then `structure()` over 293 bodies — measured 4.8s
locally and answered `FUNCTION_INVOCATION_TIMEOUT` on Vercel's 10s function limit. Baking the
entries at build time cut that to 1.2s locally and it still timed out, because what remained was
Orama's own index: 1,048ms of CPU over 14,208 chunks, holding 598MB resident. On a host that
meters CPU by memory allocation that is a fight you lose twice, and the numbers from the deployment
put the cold path near twelve seconds.

So the rows are scanned instead. `lib/search-index.ts` flattens the baked entries into one array of
headings and chunks at module load — 6ms, 40MB — and a query keeps the rows holding every one of
its terms. A cold first query answers in 46ms and the ones after it in single-digit milliseconds.
An archive of 293 items is small enough that the index was the expensive way to do a cheap thing.

| | Index | Scan |
| --- | --- | --- |
| Cold, ready to answer | 1,048ms, 598MB | 6ms, 40MB |
| First query end to end | 1.2s local, timed out deployed | 46ms |
| Later queries | 46ms | 1–5ms |

Two things go with it. Orama's typo tolerance is gone — `샌트박스` no longer reaches `샌드박스` —
though prefixes still work, because a prefix is a substring. And a multi-term query now means every
term rather than any, so `격리 구조` answers with the four chunks carrying both words instead of
several hundred carrying either; ranking a long list of one-term matches is the job the index was
for, and precision suits looking for a sentence you half remember.

The wire format is unchanged. fumadocs' fetch client asks `/api/search?query=…` for an array of
`{ id, url, type, content }` with `<mark>` in the content, so `useDocsSearch` keeps its debounce,
its cache, and its loading flag without knowing any of this happened. Each term is highlighted
rather than only the one the engine matched on.

## The palette

`components/search-palette.tsx` holds both halves. `SearchProvider` wraps the app in the root
layout, owns the open flag, and renders the dialog; `SearchTrigger` sits in the list page's own
header, beside the `New` button, and opens it through a context the provider supplies — the two
cannot be siblings, since one belongs to the layout and the other to a page. The trigger takes the
`sm` button's height and radius so the pair sits flush, but is filled rather than outlined: it
opens a search field, and reading as one says that before the label does. Its `⌘`/`Ctrl` hint is
read through `useSyncExternalStore` with a `null` server snapshot, because the platform is not
knowable during the server render and an effect that sets state is not the way to find out.

The palette itself is built on shadcn's `command`. Under this repo's `base-vega` style
that component composes `@base-ui/react/dialog` and `input-group` for its shell, so the rendered
tree stays on Base UI; the palette engine itself is `cmdk`.

`cmdk` costs less than it looks like it should, which is worth writing down because the opposite
was assumed while this was being designed. It depends on four Radix packages, and every one of them
was already in the lockfile: `fumadocs-ui` declares ten Radix dependencies directly,
`@radix-ui/react-dialog` among them. Installing `command` therefore moved the lockfile by exactly
one package and left the Radix count where it was, at 34. The previous release's "six packages out,
one in" was about direct dependencies and stays true — Radix has never actually left this project,
because the library rendering the item bodies has always brought it.

```
CommandDialog                        ⌘K · Ctrl+K · "/"
└── Command
    ├── CommandInput                 "아카이브 검색…"
    └── CommandList
        ├── CommandGroup  "아이템"    ← tier one, 293 titles, instant
        │   └── CommandItem
        ├── CommandSeparator
        ├── CommandGroup  "본문"      ← tier two, sections with anchors
        │   └── CommandItem
        └── CommandEmpty
```

Both groups cap their rows — 30 titles, 8 body results — and this is the difference between a
palette and a stutter. The route answers with every match it holds, 1,129 body results for
`에이전트`, and rendering them all put 1,185 rows and 6,811 nodes in a 288px window: `cmdk` refilters
every mounted row per keystroke, so one keypress measured 185.7ms. Capped, the same keypress
measures 7 to 22ms. The cap goes **after** matching; capping the archive first hides everything
past the newest rows, which `트레이드` catches by returning the 293rd and last item.

Nothing is filtered by `cmdk`. Titles are matched here by substring and body results were decided
by the server, so every row handed over is a keeper and `cmdk` scores nothing. Duplicates are
folded on the way in: a `page` result repeats what the title group already showed, so it is
dropped, and repeated identical chunks within one item collapse to the first — the residue of
shredded table cells.

`⌘K`, `Ctrl+K`, and `/` open it, and all three are ignored while focus sits in an input, textarea,
select, or contenteditable element. `Escape`, focus return, arrow navigation, and `Enter` belong to
the dialog and to `cmdk`, so the component's own state is the open flag and the query string,
nothing else.

`cmdk`'s scoring was checked against Korean before any of this, since every title in the archive is
Korean and subsequence scoring is a plausible way to produce nonsense. Across 42 title-query pairs
it agreed with a plain substring test every time, with no false positives — which is also why
replacing it with a substring match costs nothing here.

Styling is the registry component's own, not overridden. Checked against the live component on
shadcn's docs: rows 32px at 6px/8px padding, list 288px, group heading 12px, container 4px padding
and 14px radius. Rows are clamped to one line so they all keep that height, and the muted tokens
carry the contrast that makes a highlighted run read, rather than a colour of their own.

## The 100-item ceiling

`getIssues` defaulted to one page of 100 and nothing ever asked for a second, so `/` listed the
newest 100 of 293 published items and `generateStaticParams` prerendered the same 100. 193 items
were on the site only if you knew their number.

`getAllPublishedItems` replaces it in `lib/github.ts`, walking every page with `octokit.paginate`.
It stays in that file rather than moving to a new module: `lib/github.ts` is where the Octokit
client and the token live, and splitting item access across two files would leave no obvious answer
to which one owns a GitHub call. That deletes the hand-rolled `Link` header parsing, which only
ever looked for `&page=`, and keeps
the `body` that the previous mapping discarded — the list endpoint returns it, so 293 full bodies
arrive in three requests rather than 293. Neighbour links (`prevIssueNo`/`nextIssueNo`) were
computed within a page and so broke at the boundary, and nothing has ever read them, so they are
deleted rather than fixed.

The list at `/` groups by year with a heading between groups, keeping the existing row shape of a
title and a right-aligned date. Pagination was considered and dropped: this is an archive index,
one scannable list is the honest presentation of it, and `⌘K` covers the case pagination would
otherwise serve.

## Why not Orama Cloud

There is no free tier to evaluate. As of 2026-09-04 the open-source library is free, the managed
product is Orama Cloud Pro at a flat monthly price with a required four-hour onboarding, and the
enterprise tier is sales-scoped. The former hobby plan is gone.

It would not be the right choice at this size regardless. What a managed search service solves —
scale, vector search, RAG, AI answers — is not what 293 items and a 1.70s index build need. The
exit stays cheap if that changes: `fumadocs-core` ships `search/orama-cloud` on the server and
`search/client/orama-cloud` on the client, with `@orama/core` as an optional peer, so switching is
a change to the route and the hook rather than to the design.

## Known limits

Fenced code blocks are not indexed, because `structure()` emits no chunk for them. Searching for an
API name that only ever appears inside a code block will not find it.

A cold instance answers its first full-text query about five seconds late, most of it the GitHub
round trip. Tier
one hides this for title lookups and nothing hides it for phrase lookups.

Korean inflection is not handled by tier one — `샌드박스` does not match a title reading
`샌드박싱`. Tier two catches most of these, but only for items whose bodies contain the term.

## Verification

No test runner, following what this repository already does: a production build and real input in a
browser, written down in `CHANGELOG.md`.

The production build should go from 105 generated pages to roughly 298, with no type or lint
errors. `/i/270`, `/i/292`, and `/i/302` must answer 404, where they previously answered 200 with a
body (ADR 0003). In the browser, `⌘K` then `샌드박스`, `격리 구조`, and `Firecracker` should show
tier one immediately and tier two shortly after, and a tier-two result's `#` anchor should land on
the matching heading in the item. Cold and warm query times and the real gzipped size of the
tier-one payload get measured and recorded rather than assumed.
