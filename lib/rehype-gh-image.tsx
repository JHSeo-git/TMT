import type { Element, Root } from "hast"
import { visit } from "unist-util-visit"

import { resolveImageUrl } from "./github"

export default function rehypeGithubImageRedirect() {
  return async (tree: Root) => {
    const promises: Promise<void>[] = []

    visit(tree, "", (node: Element) => {
      if (node.type !== "element" && node.type !== "mdxJsxFlowElement") {
        return
      }

      // @ts-expect-error doesn't recognize mdxJsxFlowElement's name
      const isImageNode = node.tagName === "img" || node.name === "img"

      if (!isImageNode) {
        return
      }

      // @ts-expect-error doesn't recognize mdxJsxFlowElement's attributes
      const src = node.properties?.src ?? node.attributes.find((a) => a.name === "src")?.value
      if (typeof src !== "string") {
        return
      }

      if (!src.startsWith("https://github.com/user-attachments/assets")) {
        return
      }

      promises.push(
        resolveImageUrl(src)
          .then((resolvedSrc) => {
            if (!resolvedSrc) {
              return
            }

            if (node.properties) {
              node.properties.src = resolvedSrc
            }

            // @ts-expect-error doesn't recognize mdxJsxFlowElement's attributes
            const srcAttribute = node.attributes.find((a) => a.name === "src")
            if (srcAttribute) {
              srcAttribute.value = resolvedSrc
            }
          })
          .catch((error) => {
            console.error("Failed to fetch image redirect URL:", error)
          })
      )
    })

    await Promise.all(promises)
  }
}
