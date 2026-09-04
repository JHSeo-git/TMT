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

/** Marks a body result's value so the filter can wave it through. */
const SECTION_VALUE_PREFIX = "section::"

/** How many items to show before anything has been typed. All 293 is a wall, not a list. */
const IDLE_ITEM_COUNT = 10

export function SearchPalette({ items }: { items: PaletteItem[] }) {
  const router = useTransitionRouter()
  const [open, setOpen] = React.useState(false)
  const [input, setInput] = React.useState("")
  const { setSearch, query } = useDocsSearch({ type: "fetch" })

  // Titles answer every keystroke locally, so only the round trip is debounced.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      React.startTransition(() => setSearch(input))
    }, 300)

    return () => clearTimeout(timer)
  }, [input, setSearch])

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
   * Body results are filtered and ranked by the server, so they are waved through: filtering them
   * again here would drop any result whose match is not a contiguous substring of the chunk, which
   * a two-word query routinely is not. Titles are matched by substring, which is what `cmdk`'s own
   * scorer resolves to on this archive's Korean titles anyway.
   */
  const filter = React.useCallback((value: string, search: string, keywords?: string[]) => {
    if (value.startsWith(SECTION_VALUE_PREFIX)) {
      return 1
    }

    const haystack = `${value} ${keywords?.join(" ") ?? ""}`.toLowerCase()
    return haystack.includes(search.toLowerCase()) ? 1 : 0
  }, [])

  const typing = input.trim().length > 0
  const titleItems = typing ? items : items.slice(0, IDLE_ITEM_COUNT)

  const sections = React.useMemo(() => {
    if (!Array.isArray(query.data)) {
      return []
    }

    const seen = new Set<string>()

    return query.data.filter((result) => {
      // A `page` result repeats what the title group already showed.
      if (result.type === "page") {
        return false
      }

      if (seen.has(result.content)) {
        return false
      }

      seen.add(result.content)
      return true
    })
  }, [query.data])

  /** Closing always resets the query, so the palette opens on the idle list rather than on the
   * results of whatever was searched for last. */
  const onOpenChange = (next: boolean) => {
    setOpen(next)

    if (!next) {
      setInput("")
    }
  }

  const go = (url: string) => {
    onOpenChange(false)
    router.push(url)
  }

  const loading = typing && query.isLoading && sections.length === 0

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="아카이브 검색"
      description="제목으로 아이템을 찾거나 본문을 검색합니다."
    >
      <Command filter={filter}>
        <CommandInput value={input} onValueChange={setInput} placeholder="아카이브 검색…" />
        <CommandList className="max-h-[60vh]">
          <CommandEmpty className="py-6 text-center text-sm">결과가 없습니다.</CommandEmpty>

          <CommandGroup heading={typing ? "아이템" : "최근"}>
            {titleItems.map((item) => (
              <CommandItem
                key={item.number}
                value={item.title}
                onSelect={() => go(`/i/${item.number}`)}
              >
                <span className="line-clamp-1 flex-1 text-sm">{item.title}</span>
                <time className="text-foreground/50 text-xs tracking-tighter tabular-nums">
                  {item.createdAt.slice(0, 10).replace(/-/g, ".")}
                </time>
              </CommandItem>
            ))}
          </CommandGroup>

          {typing && (loading || sections.length > 0) && (
            <>
              <CommandSeparator />
              <CommandGroup heading="본문">
                {loading ? (
                  <div className="text-foreground/50 px-2 py-1.5 text-sm">검색 중…</div>
                ) : (
                  sections.map((result) => (
                    <CommandItem
                      key={result.id}
                      value={`${SECTION_VALUE_PREFIX}${result.id}`}
                      onSelect={() => go(result.url)}
                    >
                      {/* The chunk is dimmed so the matched run reads as the highlight without
                          needing a colour of its own. */}
                      <span className="text-foreground/55 line-clamp-2 text-sm">
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
      <mark key={match.index} className="text-foreground bg-transparent font-semibold">
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
