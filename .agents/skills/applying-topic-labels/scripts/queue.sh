#!/usr/bin/env bash
#
# secondthought 작업 큐 조작.
# 주제 판정 기준은 docs/design/topic-taxonomy.md 가 단일 출처입니다. 여기에 복사하지 마세요.
set -euo pipefail

REPO="${TMT_ITEMS_REPO:-JHSeo-git/TMT-items}"
GATE_LABEL="published"
QUEUE_LABEL="secondthought/needs-topic"
SKIP_LABEL="secondthought/skipped"
TOPICS=(
  topic/agents topic/context topic/models topic/agent-tools
  topic/frontend topic/platform topic/craft topic/work
)

die() {
  printf 'error: %s\n' "$1" >&2
  exit 1
}

# 라벨 필터 조회는 GitHub 색인이 낡으면 아이템을 조용히 누락시킵니다(ADR 0002의 #109 사례).
# 그래서 전수를 받아 클라이언트에서 거릅니다. 319건이면 4페이지로 충분히 쌉니다.
fetch_all() {
  gh api "repos/$REPO/issues?state=all&per_page=100" --paginate \
    --jq '.[] | select(has("pull_request") | not) | {number, title, labels: [.labels[].name]}'
}

valid_topic() {
  local t
  for t in "${TOPICS[@]}"; do
    [[ "$t" == "$1" ]] && return 0
  done
  return 1
}

cmd_list() {
  fetch_all | jq -r --arg q "$QUEUE_LABEL" '
    select(.labels | index($q)) | "\(.number)\t\(.title)"'
}

# 분류 대상은 발행 게이트를 통과한 아이템뿐입니다. 나머지는 사이트에 실리지 않으므로 집계에서 분리합니다.
cmd_status() {
  fetch_all | jq -rs --arg g "$GATE_LABEL" --arg q "$QUEUE_LABEL" --arg s "$SKIP_LABEL" '
    (map(select(.labels | index($g)))) as $t |
    {
      "전체": length,
      "분류 대상": $t | length,
      "  주제있음": $t | map(select(.labels | any(startswith("topic/")))) | length,
      "  큐": $t | map(select(.labels | index($q))) | length,
      "  건너뜀": $t | map(select(.labels | index($s))) | length,
      "  아직 큐에도 안 들어감": $t | map(select(
        ((.labels | any(startswith("topic/"))) | not) and
        ((.labels | index($s)) | not) and
        ((.labels | index($q)) | not)
      )) | length,
      "대상 아님 (게이트 미통과)": length - ($t | length),
    } | to_entries | map("\(.key): \(.value)") | join("\n")'
}

# 발행 게이트를 통과한 아이템 중 주제도 없고 건너뜀도 아니고 큐에도 없는 것을 큐에 넣습니다.
# 게이트를 안 통과한 아이템(secret, draft)은 사이트에 실리지 않으므로 주제가 필요 없습니다.
# 이미 큐에 있으면 건드리지 않습니다 — 무의미한 재부착은 라벨 색인을 어긋나게 합니다(ADR 0002).
cmd_enqueue() {
  local dry=0
  [[ "${1:-}" == "--dry-run" ]] && dry=1
  local targets
  targets=$(fetch_all | jq -r --arg g "$GATE_LABEL" --arg q "$QUEUE_LABEL" --arg s "$SKIP_LABEL" '
    select((.labels | index($g))
       and ((.labels | any(startswith("topic/"))) | not)
       and ((.labels | index($s)) | not)
       and ((.labels | index($q)) | not))
    | .number')

  if [[ -z "$targets" ]]; then
    echo "큐에 넣을 아이템이 없습니다."
    return 0
  fi

  local count
  count=$(printf '%s\n' "$targets" | wc -l | tr -d ' ')
  if [[ $dry -eq 1 ]]; then
    printf '%s건이 큐에 들어갑니다:\n%s\n' "$count" "$targets"
    return 0
  fi

  # 라벨 하위 리소스에 POST 하면 다른 라벨을 건드리지 않고 더합니다. 중단해도 다시 실행하면 이어집니다.
  # 한 건이 실패해도 나머지를 계속 처리하고 실패 목록을 끝에 모아 보고합니다. 재실행하면 실패분만 남습니다.
  local n ok=0 failed=()
  while read -r n; do
    if gh api -X POST "repos/$REPO/issues/$n/labels" -f "labels[]=$QUEUE_LABEL" >/dev/null 2>&1; then
      ok=$((ok + 1))
    else
      failed+=("$n")
    fi
    (((ok + ${#failed[@]}) % 25 == 0)) && printf '  %s/%s\n' "$((ok + ${#failed[@]}))" "$count"
  done <<< "$targets"

  printf '성공 %s건 / 대상 %s건\n' "$ok" "$count"
  if ((${#failed[@]} > 0)); then
    printf '실패 %s건: %s\n' "${#failed[@]}" "${failed[*]}" >&2
    return 1
  fi
}

# 판정에 필요한 만큼만 본문을 보여줍니다. 본문이 5만자인 아이템도 있습니다.
# 자르기는 jq 문자열 슬라이스로 합니다. head -c 는 바이트를 자르므로 한글이 깨집니다.
cmd_show() {
  local n="${1:?이슈 번호가 필요합니다}"
  local chars="${2:-4000}"
  gh issue view "$n" --repo "$REPO" --json number,title,labels,body \
    --jq "\"#\(.number) \(.title)\n라벨: \(.labels | map(.name) | join(\", \"))\n---\n\(.body[:$chars])\""
}

cmd_apply() {
  local n="${1:?이슈 번호가 필요합니다}"
  shift
  (($# >= 1)) || die "주제 라벨을 최소 하나 지정하세요"
  (($# <= 3)) || die "주 라벨 1개에 보조 최대 2개까지입니다 (지정: $#개)"

  local args=() t
  for t in "$@"; do
    valid_topic "$t" || die "'$t' 는 정의된 주제가 아닙니다. 가능한 값: ${TOPICS[*]}"
    args+=(--add-label "$t")
  done
  gh issue edit "$n" --repo "$REPO" "${args[@]}" --remove-label "$QUEUE_LABEL" >/dev/null
  printf '#%s <- %s\n' "$n" "$*"
}

# 주제 축과 무관하거나 내용이 없어 판정할 수 없는 아이템을 큐에서 빼냅니다.
cmd_skip() {
  local n="${1:?이슈 번호가 필요합니다}"
  gh issue edit "$n" --repo "$REPO" --add-label "$SKIP_LABEL" --remove-label "$QUEUE_LABEL" >/dev/null
  printf '#%s <- skipped\n' "$n"
}

usage() {
  cat <<'USAGE'
사용법: queue.sh <명령>

  status              전체/주제있음/큐/건너뜀/미처리 건수
  enqueue [--dry-run] 주제도 건너뜀도 없는 아이템을 큐에 넣기
  list                큐에 있는 아이템의 번호와 제목
  show <번호> [글자수] 판정용 본문 (기본 4000자)
  apply <번호> <주제...> 주제 라벨 부착 + 큐에서 제거 (주 1개 + 보조 최대 2개)
  skip <번호>          판정 불가로 표시 + 큐에서 제거

대상 저장소는 TMT_ITEMS_REPO 로 바꿀 수 있습니다 (기본: JHSeo-git/TMT-items).
USAGE
}

case "${1:-}" in
  status) shift; cmd_status "$@" ;;
  enqueue) shift; cmd_enqueue "$@" ;;
  list) shift; cmd_list "$@" ;;
  show) shift; cmd_show "$@" ;;
  apply) shift; cmd_apply "$@" ;;
  skip) shift; cmd_skip "$@" ;;
  *) usage; exit 1 ;;
esac
