import { MDXRemote } from "next-mdx-remote-client/rsc"
import recmaMdxHtmlOverride from "recma-mdx-html-override"
import rehypePrettyCode, { Options } from "rehype-pretty-code"
import remarkGfm from "remark-gfm"

import { GITHUB_ASSET_URL_PREFIX, resolveImageUrl } from "@/lib/github"
import rehypeGhImage from "@/lib/rehype-gh-image"
import { cn } from "@/lib/utils"

import { Zoom } from "./zoom"

const components = {
  h1: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className={cn("font-heading mt-2 scroll-m-20 text-2xl font-bold", className)} {...props} />
  ),
  h2: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className={cn(
        "font-heading mt-14 mb-7 scroll-m-20 text-xl font-semibold tracking-tight first:mt-0",
        className
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className={cn(
        "font-heading mt-14 mb-7 scroll-m-20 text-lg font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4
      className={cn(
        "font-heading mt-8 scroll-m-20 text-base font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  ),
  h5: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h5
      className={cn("mt-8 scroll-m-20 text-sm font-semibold tracking-tight", className)}
      {...props}
    />
  ),
  h6: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h6
      className={cn("mt-8 scroll-m-20 text-sm font-semibold tracking-tight", className)}
      {...props}
    />
  ),
  a: ({ className, ...props }: React.HTMLAttributes<HTMLAnchorElement>) => (
    <a
      className={cn("font-medium break-words underline underline-offset-4", className)}
      {...props}
    />
  ),
  p: ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn("leading-7 [&:not(:first-child)]:mt-6", className)} {...props} />
  ),
  ul: ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      className={cn("my-6 mt-4 list-disc pl-6 [li_>_&]:m-0 [li_>_&]:list-[circle]", className)}
      {...props}
    />
  ),
  ol: ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className={cn("my-3 list-decimal pl-6 [li_>_&]:m-0", className)} {...props} />
  ),
  li: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <li
      className={cn("mt-2 marker:text-zinc-500 dark:marker:text-zinc-700", className)}
      {...props}
    />
  ),
  blockquote: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <blockquote className={cn("mt-6 border-l-2 pl-6 italic", className)} {...props} />
  ),
  img: ({
    className,
    alt,
    src,
    loading = "lazy",
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const imageSrc =
      typeof src === "string" && src.startsWith(GITHUB_ASSET_URL_PREFIX)
        ? resolveImageUrl(src)
        : src

    return (
      <Zoom>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={cn(className)} alt={alt} src={imageSrc} loading={loading} {...props} />
      </Zoom>
    )
  },

  hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className="border-t-border mx-auto my-14 w-10 border-t md:my-12" {...props} />
  ),
  table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 w-full overflow-y-auto">
      <table
        className={cn("relative w-full overflow-hidden border-none text-sm", className)}
        {...props}
      />
    </div>
  ),
  tr: ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className={cn("m-0", className)} {...props} />
  ),
  th: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th
      className={cn(
        "px-4 py-2 text-left font-bold text-nowrap [&[align=center]]:text-center [&[align=right]]:text-right",
        className
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td
      className={cn(
        "px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right",
        className
      )}
      {...props}
    />
  ),
  pre: ({ className, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      className={cn(
        "mt-6 mb-4 max-h-[650px] overflow-x-auto rounded-xl bg-zinc-950 py-4 dark:bg-zinc-900",
        className
      )}
      {...props}
    />
  ),
  code: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <code
      className={cn(
        "bg-muted inherit relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm",
        className
      )}
      {...props}
    />
  ),
}

interface MdxProps {
  code: string
}

export function Mdx({ code }: MdxProps) {
  return (
    <MDXRemote
      source={code}
      components={{ ...components }}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
            rehypeGhImage,
            [
              rehypePrettyCode,
              {
                theme: "github-dark",
                defaultLang: "bash",
                bypassInlineCode: true,
              } satisfies Options,
            ],
          ],
          recmaPlugins: [
            [
              recmaMdxHtmlOverride,
              {
                tags: "img",
              },
            ],
          ],
        },
      }}
    />
  )
}
