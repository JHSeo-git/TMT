import { rehypeCodeDefaultOptions, type RehypeCodeOptions } from "fumadocs-core/mdx-plugins"

export const rehypeCodeOptions: RehypeCodeOptions = {
  ...rehypeCodeDefaultOptions,
  parseMetaString(meta, node, tree) {
    const properties = rehypeCodeDefaultOptions.parseMetaString?.(meta, node, tree)
    // Keep quoted metadata values together so a title containing "wrap" does not opt in.
    const options = meta.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)
    return options?.includes("wrap") ? { ...properties, "data-wrap-code": "true" } : properties
  },
}
