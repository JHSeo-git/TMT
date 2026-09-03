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
 * Topic labels and the name each would be shown under.
 *
 * This object is the single source of truth for which topics exist: its keys drive `TOPIC_LABELS`,
 * the `TopicLabel` type, and `isKnownTopic`, so adding a topic here carries the classification
 * script's validation along with it.
 *
 * The values are kept but nothing reads them right now — the list page dropped its label chips, so
 * the site renders no label at all. They are the intended presentation if labels return to the UI,
 * which is why `agent-tools` carries a form that reads as prose rather than its slug.
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
