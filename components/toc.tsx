// TODO: update to https://github.com/fuma-nama/fumadocs/blob/dev/packages/ui/src/components/toc/default.tsx

"use client"

import { useLayoutEffect, useRef, useState } from "react"
import type { TOCItemType } from "fumadocs-core/toc"
import * as Primitive from "fumadocs-core/toc"
import { ScrollArea, ScrollViewport } from "fumadocs-ui/components/ui/scroll-area"

import { cn } from "@/lib/utils"

export function TocItems({
  items,
  isMenu = false,
}: {
  items: TOCItemType[]
  isMenu?: boolean
}): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const pos = useTocThumb(containerRef)
  const [svg, setSvg] = useState<{
    path: string
    width: number
    height: number
  }>()

  useLayoutEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current

    function onResize(): void {
      if (container.clientHeight === 0) return
      let w = 0,
        h = 0
      const d: string[] = []
      for (let i = 0; i < items.length; i++) {
        const element: HTMLElement | null = container.querySelector(
          `a[href="#${items[i].url.slice(1)}"]`
        )
        if (!element) continue

        const styles = getComputedStyle(element)
        const offset = getLineOffset(items[i].depth) + 1,
          top = element.offsetTop + parseFloat(styles.paddingTop),
          bottom = element.offsetTop + element.clientHeight - parseFloat(styles.paddingBottom)

        w = Math.max(offset, w)
        h = Math.max(h, bottom)

        d.push(`${i === 0 ? "M" : "L"}${offset} ${top}`)
        d.push(`L${offset} ${bottom}`)
      }

      setSvg({
        path: d.join(" "),
        width: w + 1,
        height: h,
      })
    }

    const observer = new ResizeObserver(onResize)
    onResize()

    observer.observe(container)
    return () => {
      observer.disconnect()
    }
  }, [items])

  if (items.length === 0)
    return (
      <div className="bg-fd-card text-fd-muted-foreground rounded-lg border p-3 text-xs">
        No Headings
      </div>
    )

  return (
    <ScrollArea className={cn("flex flex-col pr-6", isMenu && "-ms-3")}>
      <ScrollViewport
        className="text-fd-muted-foreground relative min-h-0 mask-[linear-gradient(to_bottom,transparent,white_16px,white_calc(100%-16px),transparent)] py-3 text-sm"
        ref={containerRef}
      >
        {svg ? (
          <div
            className="absolute start-0 top-0 rtl:-scale-x-100"
            style={{
              width: svg.width,
              height: svg.height,
              maskImage: `url("data:image/svg+xml,${
                // Inline SVG
                encodeURIComponent(
                  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svg.width} ${svg.height}"><path d="${svg.path}" stroke="black" stroke-width="1" fill="none" /></svg>`
                )
              }")`,
            }}
          >
            <div
              className="bg-fd-primary transition-all"
              style={{
                marginTop: pos[0],
                height: pos[1],
              }}
            />
          </div>
        ) : null}
        <Primitive.ScrollProvider containerRef={containerRef}>
          <div className="flex flex-col">
            {items.map((item, i) => (
              <TOCItem
                key={item.url}
                item={item}
                upper={items[i - 1]?.depth}
                lower={items[i + 1]?.depth}
              />
            ))}
          </div>
        </Primitive.ScrollProvider>
      </ScrollViewport>
    </ScrollArea>
  )
}

function getItemOffset(depth: number): number {
  if (depth <= 2) return 16
  if (depth === 3) return 32
  return 48
}

function getLineOffset(depth: number): number {
  return depth >= 3 ? 12 : 0
}

function TOCItem({
  item,
  upper = item.depth,
  lower = item.depth,
}: {
  item: TOCItemType
  upper?: number
  lower?: number
}): React.ReactElement {
  const offset = getLineOffset(item.depth),
    upperOffset = getLineOffset(upper),
    lowerOffset = getLineOffset(lower)

  return (
    <Primitive.TOCItem
      href={item.url}
      style={{
        paddingInlineStart: `${getItemOffset(item.depth)}px`,
      }}
      className="data-[active=true]:text-fd-primary relative py-2 wrap-anywhere transition-colors first:pt-0 last:pb-0"
    >
      {offset !== upperOffset ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          className="absolute start-0 -top-2 size-4 rtl:-scale-x-100"
        >
          <line
            x1={upperOffset}
            y1="0"
            x2={offset}
            y2="16"
            className="stroke-fd-foreground/10"
            strokeWidth="1"
          />
        </svg>
      ) : null}
      <div
        className={cn(
          "bg-fd-foreground/10 absolute inset-y-0 w-px",
          offset !== upperOffset && "top-2",
          offset !== lowerOffset && "bottom-2"
        )}
        style={{
          insetInlineStart: offset,
        }}
      />
      {item.title}
    </Primitive.TOCItem>
  )
}

export type TOCThumb = [top: number, height: number]

export function useTocThumb(containerRef: React.RefObject<HTMLElement | null>): TOCThumb {
  const active = Primitive.useActiveAnchors()
  const [pos, setPos] = useState<TOCThumb>([0, 0])

  // effect is required to render TOC thumb at the correct position
  useLayoutEffect(() => {
    const container = containerRef.current
    if (active.length === 0 || !container || container.clientHeight === 0) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setPos([0, 0])
      return
    }

    let upper = Number.MAX_VALUE,
      lower = 0

    for (const item of active) {
      const element = container.querySelector<HTMLElement>(`a[href="#${item}"]`)
      if (!element) continue

      const styles = getComputedStyle(element)
      upper = Math.min(upper, element.offsetTop + parseFloat(styles.paddingTop))
      lower = Math.max(
        lower,
        element.offsetTop + element.clientHeight - parseFloat(styles.paddingBottom)
      )
    }

    setPos([upper, lower - upper])
  }, [active, containerRef])

  return pos
}
