import { Metadata } from "next"
import { notFound } from "next/navigation"
import defaultComponents from "fumadocs-ui/mdx"
import { SquarePen } from "lucide-react"
import { Link } from "next-view-transitions"

import { getIssueByNo, getIssues } from "@/lib/github"
import { compiler, components } from "@/components/mdx-remote"
import { TocRail } from "@/components/toc"

import { MarkdownCopyButton } from "./components/markdown-copy-button"
import { UrlShareButton } from "./components/url-share-button"

interface PageParams {
  issueNo: string
}

export async function generateStaticParams(): Promise<PageParams[]> {
  const { issues } = await getIssues()

  return issues.map((issue) => ({
    issueNo: issue.number.toString(),
  }))
}

interface PageProps {
  params: Promise<PageParams>
}

/**
 * Resolves the route's item or renders the not-found page. An unparseable number, a number with no
 * item behind it, and an item the publish gate rejects are all a bad URL rather than a server
 * fault, so this route answers 404 for each. Every other failure keeps travelling to the error
 * boundary.
 */
async function loadIssue(params: PageProps["params"]) {
  const issueNo = parseInt((await params).issueNo, 10)

  if (isNaN(issueNo) || issueNo < 1) {
    notFound()
  }

  const issue = await getIssueByNo(issueNo)

  if (!issue) {
    notFound()
  }

  return issue
}

export async function generateMetadata({ params }: PageProps) {
  const response = await loadIssue(params)

  return {
    title: response.title,
  } satisfies Metadata
}

export default async function IssuePage({ params }: PageProps) {
  const response = await loadIssue(params)

  const { body: MdxContent, toc } = await compiler.compile({
    source: response.body ?? "",
    filePath: response.issueUrl,
  })

  return (
    <>
      <TocRail toc={toc} />

      <article className="markdown-body prose my-10">
        <h1 className="not-prose font-heading mt-2 scroll-m-20 text-xl font-bold">
          {response.title}
        </h1>
        <Link href=".." className="not-prose text-link text-sm font-medium">
          TMT
        </Link>
        <div className="flex flex-row flex-wrap gap-2 py-4">
          <MarkdownCopyButton markdown={response.body ?? ""} className="text-xs" />
          <UrlShareButton className="text-xs" />
        </div>
        <MdxContent components={{ ...defaultComponents, ...components }} />
      </article>

      <div className="mt-10 flex items-center justify-between gap-4">
        <a
          href={response.issueUrl}
          className="text-link flex items-center gap-2 text-sm"
          target="_blank"
          rel="noopener noreferrer"
        >
          <SquarePen className="size-4" /> Edit this page
        </a>
        <p className="hidden text-sm sm:block">
          <em>Last updated on </em>
          {/* TODO: toLocaleString locale */}
          <strong>
            {new Date(response.updatedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
          </strong>
        </p>
      </div>
    </>
  )
}
