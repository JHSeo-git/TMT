/**
 * 아이템 라벨의 세 이름 공간.
 *
 * - 접두 없는 라벨(`published`, `draft`, `secret`)은 사람이 붙입니다.
 * - `topic/` 과 `secondthought/` 은 secondthought가 붙이고 뗍니다.
 *
 * 주제 판정 기준은 `docs/design/topic-taxonomy.md`가 단일 출처입니다.
 */

/** 아이템을 사이트에 노출할지 결정하는 단 하나의 라벨. */
export const PUBLISH_GATE_LABEL = "published"

/** 주제 라벨의 접두. */
export const TOPIC_LABEL_PREFIX = "topic/"

/** secondthought가 아직 주제를 판정하지 않은 아이템에 붙는 라벨. */
export const QUEUE_LABEL = "secondthought/needs-topic"

/** secondthought가 주제를 판정하지 않기로 한 아이템에 붙는 라벨. */
export const SKIP_LABEL = "secondthought/skipped"

/**
 * 주제 라벨과 사이트 표시명.
 *
 * 이 객체가 주제 목록의 단일 출처입니다. 주제를 추가하거나 이름을 바꿀 때 여기만 고치면
 * 사이트 표시와 분류 스크립트의 유효성 검사가 함께 따라옵니다.
 */
const TOPIC_DISPLAY_NAMES = {
  "topic/agents": "에이전트",
  "topic/context": "컨텍스트",
  "topic/models": "모델",
  "topic/agent-tools": "도구",
  "topic/frontend": "프론트엔드",
  "topic/platform": "플랫폼",
  "topic/craft": "설계와 품질",
  "topic/work": "일과 커리어",
} as const

export type TopicLabel = keyof typeof TOPIC_DISPLAY_NAMES

export const TOPIC_LABELS = Object.keys(TOPIC_DISPLAY_NAMES) as TopicLabel[]

/** `topic/` 접두를 가진 라벨인지. 정의되지 않은 주제도 참입니다. */
export function isTopicLabel(name: string | undefined): name is string {
  return typeof name === "string" && name.startsWith(TOPIC_LABEL_PREFIX)
}

/** 위 목록에 정의된 주제인지. 라벨을 붙이기 전 검사에 씁니다. */
export function isKnownTopic(name: string): name is TopicLabel {
  return name in TOPIC_DISPLAY_NAMES
}

/**
 * 표시명이 등록되지 않은 주제 라벨은 접두만 떼어 그대로 보여줍니다.
 * 라벨을 새로 만들었는데 표시명 추가를 잊어도 목록이 비지 않도록 하기 위한 것입니다.
 */
export function topicDisplayName(name: string): string {
  return (
    (TOPIC_DISPLAY_NAMES as Record<string, string>)[name] ?? name.slice(TOPIC_LABEL_PREFIX.length)
  )
}
