"use client"

import * as React from "react"
import { useDocsSearch } from "fumadocs-core/search/client"
import { useTransitionRouter } from "next-view-transitions"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

export interface PaletteItem {
  number: number
  title: string
  createdAt: string
}

/**
 * A single body result. fumadocs keeps `SortedResult` out of its public subpaths, so the type is
 * read back off the hook rather than imported.
 */
type BodyRow = Extract<ReturnType<typeof useDocsSearch>["query"]["data"], unknown[]>[number]

/** How many items to show before anything has been typed. All 293 is a wall, not a list. */
const IDLE_ITEM_COUNT = 10

/**
 * How many rows each group renders at most.
 *
 * These are not cosmetic. The route answers with every match it has — 1,129 body results for
 * `에이전트` — and `cmdk` re-runs its filter across every mounted row on each keystroke, so
 * rendering them all cost 185.7ms per keypress with about 6,800 nodes in the list. Body rows carry
 * highlight elements and are the expensive ones; titles are a single line each, so they can afford
 * a looser cap.
 */
const MAX_TITLE_ROWS = 30
const MAX_BODY_ROWS = 8

export function SearchPalette({ items }: { items: PaletteItem[] }) {
  const router = useTransitionRouter()
  const [open, setOpen] = React.useState(false)

  /**
   * `search` updates on the keystroke and `delayMs` debounces only the round trip behind it, so
   * titles filter immediately while the body request waits. This is the hook's own debounce; an
   * effect and a second piece of state on top of it would just add another 300ms.
   */
  const { search, setSearch, query } = useDocsSearch({ type: "fetch", delayMs: 200 })

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isOpener = (event.key === "k" && (event.metaKey || event.ctrlKey)) || event.key === "/"

      if (!isOpener) {
        return
      }

      // Someone typing a slash into a field means a slash, not a palette.
      const target = event.target

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return
      }

      event.preventDefault()
      setOpen((previous) => !previous)
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  /**
   * Every row handed to `cmdk` has already been decided: titles by the substring match below, body
   * results by the server. So nothing is filtered again here, which is both correct — a chunk
   * matching `격리 구조` need not contain that string contiguously, and `cmdk` would have dropped
   * it — and cheap, since `cmdk` no longer scores anything on each keystroke.
   */
  const filter = React.useCallback(() => 1, [])

  const needle = search.trim().toLowerCase()
  const typing = needle.length > 0

  /** Filtered first, then capped — capping the archive before matching would hide anything past
   * the newest few rows. */
  const titleRows = React.useMemo(() => {
    if (!typing) {
      return items.slice(0, IDLE_ITEM_COUNT)
    }

    const rows: PaletteItem[] = []

    for (const item of items) {
      if (item.title.toLowerCase().includes(needle)) {
        rows.push(item)

        if (rows.length === MAX_TITLE_ROWS) {
          break
        }
      }
    }

    return rows
  }, [items, needle, typing])

  const bodyRows = React.useMemo(() => {
    if (!Array.isArray(query.data)) {
      return []
    }

    const seen = new Set<string>()
    const rows: BodyRow[] = []

    for (const result of query.data) {
      // A `page` result repeats what the title group already showed.
      if (result.type === "page" || seen.has(result.content)) {
        continue
      }

      seen.add(result.content)
      rows.push(result)

      if (rows.length === MAX_BODY_ROWS) {
        break
      }
    }

    return rows
  }, [query.data])

  /** Closing always resets the query, so the palette opens on the idle list rather than on the
   * results of whatever was searched for last. */
  const onOpenChange = (next: boolean) => {
    setOpen(next)

    if (!next) {
      setSearch("")
    }
  }

  const go = (url: string) => {
    onOpenChange(false)
    router.push(url)
  }

  const loading = typing && query.isLoading && bodyRows.length === 0

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="아카이브 검색"
      description="제목으로 아이템을 찾거나 본문을 검색합니다."
    >
      <Command filter={filter}>
        <CommandInput value={search} onValueChange={setSearch} placeholder="아카이브 검색…" />
        <CommandList>
          <CommandEmpty>결과가 없습니다.</CommandEmpty>

          <CommandGroup heading={typing ? "아이템" : "최근"}>
            {titleRows.map((item) => (
              <CommandItem
                key={item.number}
                value={item.title}
                onSelect={() => go(`/i/${item.number}`)}
              >
                <span className="line-clamp-1 flex-1">{item.title}</span>
                {/* `CommandShortcut`'s treatment, kept on a `time` element so the date stays a
                    date. It brightens with the row the way that component does. */}
                <time className="text-muted-foreground group-data-selected/command-item:text-foreground ml-auto text-xs tracking-widest tabular-nums">
                  {item.createdAt.slice(0, 10).replace(/-/g, ".")}
                </time>
              </CommandItem>
            ))}
          </CommandGroup>

          {typing && (loading || bodyRows.length > 0) && (
            <>
              <CommandSeparator />
              <CommandGroup heading="본문">
                {loading ? (
                  <div className="text-muted-foreground px-2 py-1.5 text-sm">검색 중…</div>
                ) : (
                  bodyRows.map((result) => (
                    <CommandItem key={result.id} value={result.id} onSelect={() => go(result.url)}>
                      {/* The chunk is muted so the matched run reads as the highlight without
                          needing a colour of its own, and clamped to one line so every row keeps
                          the 32px height the rest of the list has. */}
                      <span className="text-muted-foreground line-clamp-1">
                        <Highlight text={result.content} />
                      </span>
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

const MARK = /<mark>(.*?)<\/mark>/g

/** Renders the `<mark>` markup fumadocs puts inside `content` as elements, never as raw HTML. */
function Highlight({ text }: { text: string }) {
  const parts: React.ReactNode[] = []
  let cursor = 0

  for (const match of text.matchAll(MARK)) {
    if (match.index > cursor) {
      parts.push(text.slice(cursor, match.index))
    }

    parts.push(
      <mark key={match.index} className="text-foreground bg-transparent font-medium">
        {match[1]}
      </mark>
    )

    cursor = match.index + match[0].length
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor))
  }

  return <>{parts}</>
}
