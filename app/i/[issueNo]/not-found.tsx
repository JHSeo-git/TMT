import { Link } from "next-view-transitions"

import { buttonVariants } from "@/components/ui/button"

export default function NotFound() {
  return (
    <>
      <h2>Not Found</h2>
      <p className="mt-10">Could not find requested resource</p>
      <Link href="/" className={buttonVariants({ variant: "link" })}>
        Return Home
      </Link>
    </>
  )
}
