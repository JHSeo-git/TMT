/**
 * The three label namespaces on an item.
 *
 * - Unprefixed labels (`published`, `draft`, `secret`) are applied by a human.
 * - `topic/` and `secondthought/` are applied and removed by secondthought.
 *
 * `docs/design/topic-taxonomy.md` is the single source of truth for how a topic is decided.
 */

/** The one label that decides whether an item appears on the site. */
export const PUBLISH_GATE_LABEL = "published"

/** Prefix shared by every topic label. */
export const TOPIC_LABEL_PREFIX = "topic/"

/** Marks an item whose topic secondthought has not decided yet. */
export const QUEUE_LABEL = "secondthought/needs-topic"

/** Marks an item secondthought decided not to give a topic. */
export const SKIP_LABEL = "secondthought/skipped"

/**
 * Topic labels and the name shown for each on the site.
 *
 * This object is the single source of truth for which topics exist. Adding a topic or renaming one
 * here carries both the site's display names and the classification script's validation along.
 * Most display names match the slug; the map still earns its place by defining the topic set and
 * by giving `agent-tools` a form that reads as prose.
 */
const TOPIC_DISPLAY_NAMES = {
  "topic/agents": "agents",
  "topic/context": "context",
  "topic/models": "models",
  "topic/agent-tools": "agent tools",
  "topic/frontend": "frontend",
  "topic/platform": "platform",
  "topic/craft": "craft",
  "topic/work": "work",
  "topic/devex": "devex",
} as const

export type TopicLabel = keyof typeof TOPIC_DISPLAY_NAMES

export const TOPIC_LABELS = Object.keys(TOPIC_DISPLAY_NAMES) as TopicLabel[]

/** Whether the label carries the `topic/` prefix. Undefined topics count as well. */
export function isTopicLabel(name: string | undefined): name is string {
  return typeof name === "string" && name.startsWith(TOPIC_LABEL_PREFIX)
}

/** Whether the label is one of the topics defined above. Used to validate before applying. */
export function isKnownTopic(name: string): name is TopicLabel {
  return name in TOPIC_DISPLAY_NAMES
}

/**
 * A topic label with no registered display name falls back to its slug with the prefix stripped,
 * so that forgetting to add a display name for a new label never blanks out the list.
 */
export function topicDisplayName(name: string): string {
  return (
    (TOPIC_DISPLAY_NAMES as Record<string, string>)[name] ?? name.slice(TOPIC_LABEL_PREFIX.length)
  )
}
