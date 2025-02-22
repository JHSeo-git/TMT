"use client"

// Error boundaries must be Client Components
import { useEffect } from "react"
import { Link } from "next-view-transitions"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <>
      <h2>Something went wrong!</h2>
      <p className="mt-10">failed to fetch issue</p>
      <div className="mt-2 flex items-center">
        <Button onClick={() => reset()} variant="destructive">
          Try again
        </Button>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "ml-4")}>
          Go back home
        </Link>
      </div>
    </>
  )
}
