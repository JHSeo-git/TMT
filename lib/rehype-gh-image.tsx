import type { Element, Root } from "hast"
import { visit } from "unist-util-visit"

import { GITHUB_ASSET_URL_PREFIX, resolveImageUrl } from "./github"

export default function rehypeGithubImageRedirect() {
  return async (tree: Root) => {
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

      if (!src.startsWith(GITHUB_ASSET_URL_PREFIX)) {
        return
      }

      const resolvedSrc = resolveImageUrl(src)

      if (!resolvedSrc) {
        return
      }

      if (node.properties) {
        node.properties.src = resolvedSrc
      }

      // @ts-expect-error doesn't recognize mdxJsxFlowElement's attributes
      const srcAttribute = node.attributes?.find((a) => a.name === "src")
      if (srcAttribute) {
        srcAttribute.value = resolvedSrc
      }
    })
  }
}
