import { notFound } from "next/navigation"
import { Link } from "next-view-transitions"

import { config, getAllIssues } from "@/lib/github"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export default async function Page() {
  const issues = await getAllIssues()

  if (!issues) {
    return notFound()
  }

  if (issues.length === 0) {
    return <div>No Issues...</div>
  }

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
        <ul className="mt-4">
          {issues.map((issue) => (
            <li key={issue.id}>
              <Link href={`/i/${issue.number}`} className="group flex items-center gap-1 py-1.5">
                <span className="text-sm text-slate-700 group-hover:text-slate-900">
                  {issue.title}
                </span>
                <span className="flex-1 overflow-hidden"></span>
                {issue.labels?.nodes?.map((label) => (
                  <span
                    key={label.id}
                    className="hidden rounded-full bg-slate-100/40 px-2 text-xs leading-none font-medium whitespace-nowrap transition-colors group-hover:bg-slate-100 group-hover:transition-none sm:inline-block"
                  >
                    {label.name}
                  </span>
                ))}
                <time className="text-foreground/50 group-hover:text-foreground block self-start text-sm tracking-tighter tabular-nums transition-colors group-hover:transition-none">
                  {formatDate(issue.createdAt)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      </article>
    </>
  )
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
