"use client"

import * as Primitive from "fumadocs-core/toc"

import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

/** Tick width and row indent per nesting level. The last entry covers everything deeper. */
const TICK_WIDTH = ["w-3", "w-2.5", "w-2", "w-1.5"]
const ROW_INDENT = ["ps-2", "ps-5", "ps-8", "ps-11"]

/**
 * A minimap of the item's headings, pinned to the middle of the left gutter. One tick per heading,
 * a step shorter for every nesting level, and the tick for the heading in view is filled in.
 * Clicking the rail opens the headings as a list, which stays up — including across picking a
 * heading — until it is dismissed with Escape or a click outside.
 */
export function TocRail({ toc }: { toc: Primitive.TOCItemType[] }) {
  if (toc.length === 0) return null

  return (
    <Primitive.AnchorProvider toc={toc} single>
      <Rail toc={toc} />
    </Primitive.AnchorProvider>
  )
}

function Rail({ toc }: { toc: Primitive.TOCItemType[] }) {
  const active = Primitive.useActiveAnchor()

  // Depth is the absolute heading level and an item body may start at any of them, so measuring
  // from the shallowest heading present keeps the top level's tick full length either way.
  const root = Math.min(...toc.map((item) => item.depth))
  const level = (depth: number) => Math.min(depth - root, TICK_WIDTH.length - 1)

  return (
    <Popover>
      <PopoverTrigger
        aria-label="On this page"
        className="hover:bg-muted focus-visible:ring-ring/50 fixed start-2 top-1/2 flex -translate-y-1/2 scale-99 flex-col items-end gap-3 rounded-md px-2 py-3 opacity-80 transition outline-none hover:scale-100 hover:opacity-100 focus-visible:ring-[3px] max-lg:hidden"
      >
        {toc.map((item) => (
          <span
            key={item.url}
            className={cn(
              "h-[1.5px] rounded-full transition-colors",
              TICK_WIDTH[level(item.depth)],
              active === item.url.slice(1)
                ? "bg-foreground"
                : level(item.depth) === 0
                  ? "bg-muted-foreground"
                  : "bg-muted-foreground/50"
            )}
          />
        ))}
      </PopoverTrigger>
      <PopoverContent
        side="inline-end"
        align="center"
        // The rail is fixed to the viewport, so an absolutely positioned panel — Base UI's default —
        // has to have its transform rewritten on every scroll frame just to hold still, and any
        // frame the main thread misses shows up as the panel sliding. Positioning it the same way
        // the rail is positioned means there is nothing to recompute.
        positionMethod="fixed"
        className="max-h-[calc(100dvh-2.5rem)] w-60 gap-0 overflow-auto p-1"
      >
        {toc.map((item) => (
          <Primitive.TOCItem
            key={item.url}
            href={item.url}
            className={cn(
              "text-muted-foreground hover:bg-muted hover:text-foreground data-[active=true]:text-foreground block rounded-sm py-1.5 pe-2 text-sm wrap-anywhere transition-colors",
              ROW_INDENT[level(item.depth)]
            )}
          >
            {item.title}
          </Primitive.TOCItem>
        ))}
      </PopoverContent>
    </Popover>
  )
}
