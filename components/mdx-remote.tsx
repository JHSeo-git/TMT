import { createCompiler } from "@fumadocs/mdx-remote"
import { remarkImage } from "fumadocs-core/mdx-plugins"
import recmaMdxHtmlOverride from "recma-mdx-html-override"

import { GITHUB_ASSET_URL_PREFIX, resolveImageUrl } from "@/lib/github"
import rehypeGhImage from "@/lib/rehype-gh-image"
import { cn } from "@/lib/utils"

import { Zoom } from "./zoom"

export const components = {
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
      className={cn("font-medium break-words underline decoration-1 underline-offset-4", className)}
      {...props}
    />
  ),
  p: ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn("leading-7 [&:not(:first-child)]:mt-6", className)} {...props} />
  ),
  // ul: ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
  //   <ul
  //     className={cn("my-6 mt-4 list-disc pl-6 [li_>_&]:m-0 [li_>_&]:list-[circle]", className)}
  //     {...props}
  //   />
  // ),
  // ol: ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
  //   <ol className={cn("my-3 list-decimal pl-6 [li_>_&]:m-0", className)} {...props} />
  // ),
  // li: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
  //   <li
  //     className={cn("mt-2 marker:text-zinc-500 dark:marker:text-zinc-700", className)}
  //     {...props}
  //   />
  // ),
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
}

export const compiler = createCompiler({
  remarkPlugins: [[remarkImage, { onError: "ignore" }]],
  rehypePlugins: [rehypeGhImage],
  recmaPlugins: [
    [
      recmaMdxHtmlOverride,
      {
        tags: "img",
      },
    ],
  ],
})
