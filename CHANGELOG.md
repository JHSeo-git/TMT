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
- 주제 라벨을 붙이는 작업을 `.agents/skills/secondthought/` 스킬로 만들었습니다. 판정 기준은 `docs/design/topic-taxonomy.md`를 단일 출처로 가리키고, 조회·부착 같은 기계적인 일은 `scripts/queue.sh`(`status`/`enqueue`/`list`/`show`/`apply`/`skip`)가 맡습니다. 큐 조회는 `gh issue list --label`을 쓰지 않고 전수를 받아 직접 거르는데, #109에서 본 것처럼 라벨 필터 색인을 신뢰할 수 없기 때문입니다.
- 스킬 검증으로 실제 아이템 두 건이 분류됐습니다: #155 「React 19.2」에 `topic/frontend`, #302 `dump`에 `secondthought/skipped`. 남은 317건은 아직 미처리입니다.

## 2026-09-03 - 기록 체계 도입과 주제 분류 체계 확정

- 이 저장소를 프로젝트 기록의 본가로 정했습니다: 용어는 `CONTEXT.md`, 되돌리기 어려운 결정은 `docs/adr/`, 되돌릴 수 있는 설계는 `docs/design/`, 눈에 보이는 변화는 이 파일이 맡습니다. 결정을 `TMT-items` 이슈로 발행하는 도그푸딩과 단일 `DECISIONS.md`를 검토했지만 전자는 `grep`·`diff`·코드 리뷰가 안 되고 후자는 결정 하나를 링크로 가리킬 수 없어 접었습니다 (ADR 0001).
- 라벨을 주제 축(`topic/*`)과 발행·상태 축(`learn`, `draft`, `secret`)으로 분리했습니다. 아이템 319건 중 282건이 `learn` 하나만 달고 있고 앱은 바로 그 `learn`으로 발행 여부를 가리므로, 기존 라벨의 의미를 바꾸지 않고 별도 이름 공간을 새로 얹는 쪽을 택했습니다. 덕분에 `secondthought`의 쓰기 권한이 "`topic/`으로 시작하는 라벨만"이라는 한 줄로 정의되고, 에이전트가 오판해도 발행 게이트나 `secret`에 닿을 수 없습니다 (ADR 0002).
- 주제 카테고리를 8개로 확정했습니다 — `topic/agents`, `topic/platform`, `topic/work`, `topic/context`, `topic/frontend`, `topic/craft`, `topic/agent-tools`, `topic/models`. 아이템 319건 전수를 분석해 정했고, 판정 근거와 경계 규칙은 `docs/design/topic-taxonomy.md`에 있습니다. 주 라벨 하나에 보조 라벨 최대 2개를 허용하는데, 키워드 기준으로 정확히 한 카테고리에만 걸리는 아이템이 37건뿐이어서 상호배타적 단일 분류가 성립하지 않기 때문입니다.
- 앞으로 남은 일: 앱에 `topic/` 라벨 → 한국어 표시명 매핑을 추가해야 합니다. `app/p/page.tsx`가 `label.name`을 그대로 칩으로 그리므로 지금 라벨을 붙이면 목록에 `topic/agents` 문자열이 노출됩니다. 그리고 `secondthought` 워크플로는 이슈 이벤트가 발생하는 `TMT-items` 저장소에 들어갑니다.
