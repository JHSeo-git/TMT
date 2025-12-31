import { Metadata } from "next"
import { notFound } from "next/navigation"
import defaultComponents from "fumadocs-ui/mdx"
import { ArrowUpLeft, SquarePen, Text } from "lucide-react"
import { Link } from "next-view-transitions"

import { getIssueByNo, getIssues } from "@/lib/github"
import { cn } from "@/lib/utils"
import { TOCItems } from "@/components/clerk"
import { compiler, components } from "@/components/mdx-remote"
import { TOCProvider, TOCScrollArea } from "@/components/toc"

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
    <TOCProvider toc={toc}>
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

        <PageNavigate>
          <div className="mt-8 flex flex-col justify-end gap-2">
            <Link
              href=".."
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 italic"
            >
              <ArrowUpLeft />
              <span>Index</span>
            </Link>
          </div>
        </PageNavigate>

        <PageToc>
          <h3 className="text-muted-foreground mb-1 flex items-center gap-1 text-sm">
            <Text className="size-4" />
            <span className="font-semibold">On this Page</span>
          </h3>
          <TOCScrollArea>
            <TOCItems />
          </TOCScrollArea>
        </PageToc>
      </div>
    </TOCProvider>
  )
}

function PageNavigate({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("absolute top-0 -left-[143px] max-xl:hidden", className)} {...props}>
      <div className="fixed top-0 flex h-full max-w-full flex-col pt-18 pb-6">{children}</div>
    </div>
  )
}

function PageToc({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("absolute top-0 left-full ml-10 h-dvh w-[286px] max-xl:hidden", className)}
      {...props}
    >
      <div className="fixed top-0 flex h-full max-w-full flex-col pt-18 pb-6">{children}</div>
    </div>
  )
}
