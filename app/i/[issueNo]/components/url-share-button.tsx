"use client"

import { ComponentProps, useState } from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"

import { buttonVariants } from "../../../../components/ui/button"
import { useCopyButton } from "../../../../components/use-copy-button"

export function UrlShareButton({ ...props }: ComponentProps<"button"> & {}) {
  const [isLoading, setLoading] = useState(false)
  const [checked, onClick] = useCopyButton(async () => {
    setLoading(true)

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": window.location.origin + window.location.pathname,
        }),
      ])
    } finally {
      setLoading(false)
    }
  })

  return (
    <button
      disabled={isLoading}
      onClick={onClick}
      {...props}
      className={cn(
        buttonVariants({
          variant: "outline",
          size: "sm",
          className: "[&_svg]:text-fd-muted-foreground gap-2 [&_svg]:size-3.5",
        }),
        props.className
      )}
    >
      {checked ? <Check /> : <Copy />}
      {checked ? "Copied" : "Share URL"}
    </button>
  )
}
