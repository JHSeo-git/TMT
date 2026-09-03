---
summary: TMT 사이트와 아이템 아카이브의 변경 타임라인.
---

# Changelog

## 2026-09-03 - published 발행 게이트와 secondthought 작업 큐

- 발행 게이트를 `learn`에서 `published`로 바꿨습니다. 라벨을 새로 만들어 재부착하는 대신 GitHub의 라벨 이름 변경을 써서 293건에 붙은 상태가 그대로 따라왔습니다. `learn`("Today I learned")은 발행 여부와 아무 상관이 없는 말이었고, `published`는 이미 있는 `draft`와 정확히 대구를 이룹니다 (ADR 0002).
- 라벨을 소유자에 따라 세 이름 공간으로 나눴습니다: 접두 없는 라벨(`published`, `draft`, `secret`)은 사람의 것, `topic/`과 `secondthought/`는 secondthought의 것입니다. **`/`가 들어간 라벨은 기계의 것, 없는 라벨은 사람의 것**이라는 규칙 하나로 에이전트의 쓰기 범위가 정의되고, 오판해도 발행 게이트나 `secret`에 닿을 수 없습니다.
- `topic/` 라벨 8개와 `secondthought/needs-topic`, `secondthought/skipped`를 만들었습니다. 큐 라벨에는 반드시 출구가 필요해서 `skipped`를 함께 만들었는데, 판정 불가한 아이템(내용이 없는 것, 주제 축과 무관한 개인 기록)을 큐에 남겨 두면 큐가 영구히 비지 않기 때문입니다.
- 앱을 새 라벨 체계에 맞췄습니다. `lib/labels.ts`가 게이트 라벨 상수와 `topic/` 표시명 매핑을 갖고, `lib/github.ts`는 하드코딩된 `"learn"`과 `// TODO: config로 분리` 주석을 상수 참조로 대체했습니다. `app/p/page.tsx`는 이제 `topic/` 라벨만 골라 한국어 표시명으로 그리고 상태 라벨은 감춥니다. 곁들여 두 함수에 똑같이 복제돼 있던 라벨 정규화 8줄을 `toLabelNodes`로 합쳤는데, 이름 없는 라벨을 데이터 계층에서 걸러 내므로 렌더 쪽이 `string | undefined`를 다루지 않아도 됩니다.
- 검증 중에 별개의 누락 버그를 찾아 고쳤습니다. #109 「Augmented Coding: Beyond the Vibes」는 게이트 라벨을 확실히 보유하고 있는데도 라벨 필터 조회에서 빠져 사이트 목록에 나타나지 않고 있었습니다. 2025-08-27에 라벨을 뗐다 붙인 이력이 있고 그때부터 GitHub의 필터 색인이 어긋난 것으로 보입니다. 이름 변경과 무관하게 그 전부터 있던 누락이며, 라벨을 한 번 더 토글해 재색인시켜 해결했습니다.
- 주제 라벨을 붙이는 작업을 `.agents/skills/applying-topic-labels/` 스킬로 만들고 `.claude/skills/`에 심링크로 연결했습니다. 스킬 이름에 에이전트 이름(`secondthought`)을 쓰지 않은 것은 스킬이 작업이고 에이전트는 그 작업을 자동으로 하게 될 주체여서, 둘을 같은 이름으로 부르면 나중에 GitHub Action을 붙일 때 구분이 안 되기 때문입니다. 판정 기준은 `docs/design/topic-taxonomy.md`를 단일 출처로 가리키고, 조회·부착 같은 기계적인 일은 `scripts/queue.ts`(`status`/`enqueue`/`list`/`show`/`apply`/`skip`)가 맡습니다. 큐 조회는 `gh issue list --label`을 쓰지 않고 전수를 받아 직접 거르는데, #109에서 본 것처럼 라벨 필터 색인을 신뢰할 수 없기 때문입니다.
- 스킬 검증으로 실제 아이템 세 건이 분류됐습니다: #155 「React 19.2」와 #230 「현대 브라우저는 어떻게 동작하는가?」에 `topic/frontend`, #302 `dump`에 `secondthought/skipped`.
- 분류 대상을 발행 게이트를 통과한 아이템으로 한정했습니다. `secret`(이력서, 여행 기록)이나 `draft`는 사이트에 실리지 않으므로 주제가 필요 없고, 대부분 주제 축과 아예 무관합니다. 덕분에 그런 아이템을 큐에 넣었다가 하나씩 `skipped`로 빼내는 헛일이 사라졌습니다.
- 분류 CLI를 셸에서 TypeScript로 옮겼습니다(`scripts/queue.sh` → `queue.ts`, bun 실행). 이유는 주제 8개 목록이 `lib/labels.ts`와 셸 스크립트에 이중으로 있었다는 것입니다 — 주제를 하나 추가하면 두 곳을 고쳐야 하고 한쪽만 고치면 앱은 표시하는데 스크립트는 거부하는 상태가 됩니다. 이제 `lib/labels.ts`가 주제 목록의 단일 출처이고 CLI가 그것을 import합니다. `TOPIC_DISPLAY_NAMES`의 키에서 `TOPIC_LABELS`와 `TopicLabel` 타입을 파생시켰으므로 목록이 어긋날 수 없습니다.
- `tsconfig.json`의 `include`에 `.agents/**/*.ts`를 더했습니다. TypeScript의 와일드카드가 점으로 시작하는 디렉터리를 훑지 않아서 CLI가 타입 검사 밖에 있었는데, 이제 앱 빌드가 CLI까지 검사하므로 라벨 모듈과의 연결이 끊기면 빌드가 실패합니다.
- 셸에서 겪은 버그 두 종류가 구조적으로 사라졌습니다. jq가 따옴표 없는 한글 객체 키를 거부하던 문제와 `head -c`가 UTF-8을 바이트로 잘라 한글을 깨뜨리던 문제입니다. `show`는 이제 코드 포인트 단위로 잘라 이모지도 안전합니다. 덧붙여 octokit이 품고 있는 retry·throttling 플러그인이 레이트 리밋 백오프를 자동으로 처리합니다. 쓰기는 GitHub 권고대로 직렬을 유지했습니다.
- `published` 아이템 292건을 작업 큐에 넣었습니다(293건 중 #155는 이미 주제 보유). 게이트를 통과하지 않은 26건은 큐에 들어가지 않았고, 대상 중 큐에도 주제에도 없는 아이템은 0건입니다. 벌크 부착은 라벨 하위 리소스에 POST 해서 다른 라벨을 건드리지 않으며, 개별 실패를 모아 보고하고 재실행하면 실패분만 남으므로 중단해도 이어받을 수 있습니다.

## 2026-09-03 - 기록 체계 도입과 주제 분류 체계 확정

- 이 저장소를 프로젝트 기록의 본가로 정했습니다: 용어는 `CONTEXT.md`, 되돌리기 어려운 결정은 `docs/adr/`, 되돌릴 수 있는 설계는 `docs/design/`, 눈에 보이는 변화는 이 파일이 맡습니다. 결정을 `TMT-items` 이슈로 발행하는 도그푸딩과 단일 `DECISIONS.md`를 검토했지만 전자는 `grep`·`diff`·코드 리뷰가 안 되고 후자는 결정 하나를 링크로 가리킬 수 없어 접었습니다 (ADR 0001).
- 라벨을 주제 축(`topic/*`)과 발행·상태 축(`learn`, `draft`, `secret`)으로 분리했습니다. 아이템 319건 중 282건이 `learn` 하나만 달고 있고 앱은 바로 그 `learn`으로 발행 여부를 가리므로, 기존 라벨의 의미를 바꾸지 않고 별도 이름 공간을 새로 얹는 쪽을 택했습니다. 덕분에 `secondthought`의 쓰기 권한이 "`topic/`으로 시작하는 라벨만"이라는 한 줄로 정의되고, 에이전트가 오판해도 발행 게이트나 `secret`에 닿을 수 없습니다 (ADR 0002).
- 주제 카테고리를 8개로 확정했습니다 — `topic/agents`, `topic/platform`, `topic/work`, `topic/context`, `topic/frontend`, `topic/craft`, `topic/agent-tools`, `topic/models`. 아이템 319건 전수를 분석해 정했고, 판정 근거와 경계 규칙은 `docs/design/topic-taxonomy.md`에 있습니다. 주 라벨 하나에 보조 라벨 최대 2개를 허용하는데, 키워드 기준으로 정확히 한 카테고리에만 걸리는 아이템이 37건뿐이어서 상호배타적 단일 분류가 성립하지 않기 때문입니다.
- 앞으로 남은 일: 앱에 `topic/` 라벨 → 한국어 표시명 매핑을 추가해야 합니다. `app/p/page.tsx`가 `label.name`을 그대로 칩으로 그리므로 지금 라벨을 붙이면 목록에 `topic/agents` 문자열이 노출됩니다. 그리고 `secondthought` 워크플로는 이슈 이벤트가 발생하는 `TMT-items` 저장소에 들어갑니다.
