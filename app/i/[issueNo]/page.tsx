import { notFound } from "next/navigation"
import { SquarePen } from "lucide-react"
import { Link } from "next-view-transitions"

import { getIssueByNo, getIssues } from "@/lib/github"
import { Mdx } from "@/components/mdx-remote"

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

export default async function IssuePage({ params }: PageProps) {
  const issueNoStr = (await params).issueNo
  const issueNo = parseInt(issueNoStr, 10)

  if (isNaN(issueNo) || issueNo < 1) {
    throw new Error("Invalid issue number")
  }

  const response = await getIssueByNo(issueNo)

  if (!response) {
    return notFound()
  }

  return (
    <article className="markdown-body my-10">
      <h1 className="font-heading mt-2 scroll-m-20 text-xl font-bold">{response.title}</h1>
      <Link href=".." className="text-link text-sm font-medium">
        TMT
      </Link>
      <Mdx code={response.body ?? ""} />
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
    </article>
  )
}
