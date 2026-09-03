/**
 * 아이템 라벨의 세 이름 공간.
 *
 * - 접두 없는 라벨(`published`, `draft`, `secret`)은 사람이 붙입니다.
 * - `topic/` 과 `secondthought/` 은 secondthought가 붙이고 뗍니다.
 *
 * 판정 기준은 `docs/design/topic-taxonomy.md`가 단일 출처입니다.
 */

/** 아이템을 사이트에 노출할지 결정하는 단 하나의 라벨. */
export const PUBLISH_GATE_LABEL = "published"

/** 주제 라벨의 접두. */
export const TOPIC_LABEL_PREFIX = "topic/"

/** 주제 라벨을 사이트에서 사람에게 보여줄 때 쓰는 이름. */
const TOPIC_DISPLAY_NAMES: Record<string, string> = {
  "topic/agents": "에이전트",
  "topic/context": "컨텍스트",
  "topic/models": "모델",
  "topic/agent-tools": "도구",
  "topic/frontend": "프론트엔드",
  "topic/platform": "플랫폼",
  "topic/craft": "설계와 품질",
  "topic/work": "일과 커리어",
}

export function isTopicLabel(name: string | undefined): name is string {
  return typeof name === "string" && name.startsWith(TOPIC_LABEL_PREFIX)
}

/**
 * 표시명이 등록되지 않은 주제 라벨은 접두만 떼어 그대로 보여줍니다.
 * 라벨을 새로 만들었는데 표시명 추가를 잊어도 목록이 비지 않도록 하기 위한 것입니다.
 */
export function topicDisplayName(name: string): string {
  return TOPIC_DISPLAY_NAMES[name] ?? name.slice(TOPIC_LABEL_PREFIX.length)
}
