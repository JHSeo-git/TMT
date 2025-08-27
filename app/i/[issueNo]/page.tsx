import { Metadata } from "next"
import { notFound } from "next/navigation"
import { AnchorProvider } from "fumadocs-core/toc"
import defaultComponents from "fumadocs-ui/mdx"
import { SquarePen, Text } from "lucide-react"
import { Link } from "next-view-transitions"

import { getIssueByNo, getIssues } from "@/lib/github"
import { cn } from "@/lib/utils"
import { compiler, components } from "@/components/mdx-remote"
import { TocItems } from "@/components/toc"

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

export async function generateMetadata({ params }: PageProps) {
  const issueNoStr = (await params).issueNo
  const issueNo = parseInt(issueNoStr, 10)

  if (isNaN(issueNo) || issueNo < 1) {
    throw new Error("Invalid issue number")
  }

  const response = await getIssueByNo(issueNo)

  if (!response) {
    return notFound()
  }

  return {
    title: response.title,
  } satisfies Metadata
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

  const { body: MdxContent, toc } = await compiler.compile({
    source: response.body ?? "",
    filePath: response.issueUrl,
  })

  return (
    <AnchorProvider toc={toc}>
      <div className="relative">
        <article className="markdown-body prose my-10">
          <h1 className="not-prose font-heading mt-2 scroll-m-20 text-xl font-bold">
            {response.title}
          </h1>
          <Link href=".." className="not-prose text-link text-sm font-medium">
            TMT
          </Link>
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
        <PageToc>
          <h3 className="text-muted-foreground mb-1 flex items-center gap-1 text-sm">
            <Text className="size-4" />
            <span className="font-semibold">On this Page</span>
          </h3>
          <TocItems items={toc} />
        </PageToc>
      </div>
    </AnchorProvider>
  )
}

function PageToc({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("absolute top-0 left-full ml-10 h-dvh max-xl:hidden", className)} {...props}>
      <div className="fixed top-0 flex h-full w-[286px] max-w-full flex-col pt-18 pb-6">
        {children}
      </div>
    </div>
  )
}
