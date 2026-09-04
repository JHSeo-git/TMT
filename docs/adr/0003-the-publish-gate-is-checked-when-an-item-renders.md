# The publish gate is checked when an item renders, not only when pages are prerendered

`/i/270`, `/i/292`, and `/i/302` each answered `200` with a fully rendered body while carrying no
`published` label, so none of them appeared in the site's list. One is a personal travel record and
two are scratch items. Walking `/i/1` through `/i/321` therefore exposed the whole of a private
archive, which is the opposite of what `CONTEXT.md` says the publish gate is for: it is "the one
label that decides whether an item appears on the site."

Two things had to line up for that to happen. `getIssueByNo` in `lib/github.ts` called
`issues.get` and returned whatever came back, checking neither `state` nor the presence of
`published` — the gate was applied by `getIssues` when building the list, and an item fetched by
number never passed through it. And `generateStaticParams` prerenders only published items, but
Next's `dynamicParams` defaults to `true`, so a number missing from that set is not a 404: it is a
page rendered on demand.

The gate therefore moves into `getIssueByNo`, which answers `null` for an issue that is not open or
does not carry `published`. `loadIssue` already turns an unparseable number into a 404, so a `null`
takes that same path and the page gains a branch rather than a new concept.

Build time needs nothing of its own. `generateStaticParams` draws from `getAllPublishedItems`, so
the prerendered set is gated by construction; the check exists for the numbers that arrive on
demand, which is exactly where the hole was.

Putting it in the fetch rather than in the page is what the call graph asks for. `getIssueByNo` has
one caller, and the search index is assembled from `getAllPublishedItems` — the list endpoint
returns bodies, so nothing else ever fetches a single issue. No consumer wants the ungated version,
so there is no reason to keep one available.

## Considered Options

- **`export const dynamicParams = false`.** One line, and it closes the hole for every number
  outside the prerendered set. But it closes it by accident rather than on purpose: the reason
  `/i/270` would 404 becomes "it was not in the build" instead of "it is not published". An item
  published between deploys would then 404 until the next build, and a future move to on-demand
  revalidation would silently reopen the hole. Worth adding as a second layer, never as the only
  one.
- **Checking in the page and leaving `getIssueByNo` permissive.** Keeps the fetch a thin wrapper
  over `issues.get`, but it leaves a function in `lib/github.ts` that hands unpublished items to
  whoever calls it, and the gate then has to be restated at every call site that appears later.
  With one caller today the two are identical in behaviour; the whole difference is in the next
  caller.
- **Middleware on `/i/:number`.** Would need the label set to decide, which means the fetch happens
  twice or the gate is duplicated.
- **Leaving it.** The URLs are unguessable in practice only if nobody counts to 321.

## Consequences

`#302` appears in `CHANGELOG.md` as a verification case for the heading rail — "items with no
headings (#1, #302) render no rail at all" — so an unpublished item was reachable while the site
was being worked on, and that is how it was used. After this change an unpublished item cannot be
opened on the deployed site, and checking one means running the app locally or publishing it.

The three numbers above become the regression check for this decision. They answered `200` with a
body before it and must answer `404` after, which is a curl away and needs no test runner.

`getIssues` is replaced by `getAllPublishedItems` in the same change, so both expressions of the
gate end up in `lib/github.ts` and nowhere else: the list query asks GitHub for the label, and the
single fetch checks the label on what comes back. The list, the prerender set, and the search index
are all downstream of the first; the item page is the only thing downstream of the second.
