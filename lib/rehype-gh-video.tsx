import type { Element, Root } from "hast"
import { visit } from "unist-util-visit"

import { GITHUB_ASSET_URL_PREFIX, resolveAssetUrl } from "./github"

export default function rehypeGithubVideoRedirect() {
  return async (tree: Root) => {
    visit(tree, "", (node: Element) => {
      if (
        node.type !== "element" &&
        node.type !== "mdxJsxFlowElement" &&
        node.type !== "mdxJsxTextElement"
      ) {
        return
      }

      // @ts-expect-error doesn't recognize mdxJsxFlowElement's name
      const isVideoNode = node.tagName === "video" || node.name === "video"

      if (!isVideoNode) {
        return
      }

      // @ts-expect-error doesn't recognize mdxJsxFlowElement's attributes
      const src = node.properties?.src ?? node.attributes?.find((a) => a.name === "src")?.value
      if (typeof src !== "string") {
        return
      }

      if (!src.startsWith(GITHUB_ASSET_URL_PREFIX)) {
        return
      }

      const resolvedSrc = resolveAssetUrl(src)

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
