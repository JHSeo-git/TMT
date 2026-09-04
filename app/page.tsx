import { Link } from "next-view-transitions"

import { config, getAllPublishedItems, type Item } from "@/lib/github"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export default async function Page() {
  const items = await getAllPublishedItems()

  return (
    <>
      <div className="mt-10 flex items-center justify-between">
        <h1 className="m-0 cursor-default font-semibold">TMT</h1>
        <a
          href={`https://github.com/${config.owner}/${config.repo}/issues/new?template=Blank+issue`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
        >
          New
        </a>
      </div>
      <article>
        {groupByYear(items).map(([year, yearItems]) => (
          <section key={year} className="mt-8">
            <h2 className="text-foreground/40 border-border m-0 border-b pb-1 text-xs font-medium tracking-widest tabular-nums">
              {year}
            </h2>
            <ul className="mt-2">
              {yearItems.map((item) => (
                <li key={item.id}>
                  <Link href={`/i/${item.number}`} className="group flex items-center gap-1 py-1.5">
                    <span className="text-sm text-slate-700 group-hover:text-slate-900">
                      {item.title}
                    </span>
                    <span className="flex-1 overflow-hidden"></span>
                    <time className="text-foreground/50 group-hover:text-foreground block text-sm tracking-tighter tabular-nums transition-colors group-hover:transition-none">
                      {formatDate(item.createdAt)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </article>
    </>
  )
}

/** Items arrive newest first, so grouping in encounter order already yields years descending. */
function groupByYear(items: Item[]): [string, Item[]][] {
  const groups = new Map<string, Item[]>()

  for (const item of items) {
    const year = new Date(item.createdAt).getFullYear().toString()
    const group = groups.get(year)

    if (group) {
      group.push(item)
    } else {
      groups.set(year, [item])
    }
  }

  return [...groups]
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return (
    date
      // TODO: toLocaleString locale
      .toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\. /g, ".")
      .slice(0, -1)
  )
}
