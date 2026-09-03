#!/usr/bin/env bun
/**
 * secondthought 작업 큐 조작.
 *
 * 주제 판정 기준은 `docs/design/topic-taxonomy.md`가, 주제 목록은 `lib/labels.ts`가
 * 단일 출처입니다. 둘 다 이 파일에 복사하지 마세요.
 *
 * 저장소 루트에서 실행해야 합니다. bun이 `.env`를 자동으로 읽습니다.
 */
import { Octokit } from "octokit"

import {
  isKnownTopic,
  isTopicLabel,
  PUBLISH_GATE_LABEL,
  QUEUE_LABEL,
  SKIP_LABEL,
  TOPIC_LABELS,
} from "@/lib/labels"

const owner = requireEnv("GITHUB_OWNER")
const repo = requireEnv("GITHUB_REPO")

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    fail(`env.${name} 이 없습니다. 저장소 루트에서 실행했는지 확인하세요.`)
  }
  return value
}

function fail(message: string): never {
  console.error(`error: ${message}`)
  process.exit(1)
}

const octokit = new Octokit({
  auth: requireEnv("GITHUB_TOKEN"),
  // octokit 메타패키지가 throttling 플러그인의 콜백 타입을 옵션 타입에 연결해두지 않아
  // 인자 타입을 직접 붙입니다. 쓰는 것만 좁게 받습니다.
  throttle: {
    onRateLimit: (retryAfter: number, _options: unknown, _octokit: unknown, retryCount: number) => {
      console.error(`  레이트 리밋: ${retryAfter}초 후 재시도 (${retryCount + 1}회차)`)
      return retryCount < 3
    },
    onSecondaryRateLimit: (
      retryAfter: number,
      _options: unknown,
      _octokit: unknown,
      retryCount: number
    ) => {
      console.error(`  2차 레이트 리밋: ${retryAfter}초 후 재시도 (${retryCount + 1}회차)`)
      return retryCount < 3
    },
  },
})

interface Item {
  number: number
  title: string
  labels: string[]
}

/**
 * 라벨 필터 조회는 GitHub 색인이 낡으면 아이템을 조용히 누락시킵니다(ADR 0002의 #109 사례).
 * 그래서 전수를 받아 여기서 거릅니다. 319건이면 4페이지로 충분히 쌉니다.
 */
async function fetchAll(): Promise<Item[]> {
  const issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
    owner,
    repo,
    state: "all",
    per_page: 100,
  })

  return issues
    .filter((issue) => !issue.pull_request)
    .map((issue) => ({
      number: issue.number,
      title: issue.title,
      labels: issue.labels.flatMap((label) => {
        const name = typeof label === "string" ? label : label.name
        return name ? [name] : []
      }),
    }))
}

const has = (item: Item, label: string) => item.labels.includes(label)
const hasTopic = (item: Item) => item.labels.some(isTopicLabel)
/** 분류 대상은 발행 게이트를 통과한 아이템뿐입니다. 나머지는 사이트에 실리지 않습니다. */
const inScope = (item: Item) => has(item, PUBLISH_GATE_LABEL)

async function addLabels(issue: number, labels: string[]) {
  await octokit.rest.issues.addLabels({ owner, repo, issue_number: issue, labels })
}

/** 없는 라벨을 떼려 하면 404가 오는데, 큐에 없는 아이템을 처리하는 정상 경로이므로 삼킵니다. */
async function removeLabel(issue: number, name: string) {
  try {
    await octokit.rest.issues.removeLabel({ owner, repo, issue_number: issue, name })
  } catch (error) {
    if ((error as { status?: number }).status !== 404) throw error
  }
}

async function cmdStatus() {
  const all = await fetchAll()
  const target = all.filter(inScope)
  const rows: [string, number][] = [
    ["전체", all.length],
    ["분류 대상", target.length],
    ["  주제있음", target.filter(hasTopic).length],
    ["  큐", target.filter((i) => has(i, QUEUE_LABEL)).length],
    ["  건너뜀", target.filter((i) => has(i, SKIP_LABEL)).length],
    [
      "  아직 큐에도 안 들어감",
      target.filter((i) => !hasTopic(i) && !has(i, SKIP_LABEL) && !has(i, QUEUE_LABEL)).length,
    ],
    ["대상 아님 (게이트 미통과)", all.length - target.length],
  ]
  for (const [key, value] of rows) console.log(`${key}: ${value}`)
}

async function cmdList() {
  const queued = (await fetchAll()).filter((i) => has(i, QUEUE_LABEL))
  for (const item of queued) console.log(`${item.number}\t${item.title}`)
}

async function cmdEnqueue(dryRun: boolean) {
  const targets = (await fetchAll()).filter(
    (i) => inScope(i) && !hasTopic(i) && !has(i, SKIP_LABEL) && !has(i, QUEUE_LABEL)
  )

  if (targets.length === 0) {
    console.log("큐에 넣을 아이템이 없습니다.")
    return
  }
  if (dryRun) {
    console.log(`${targets.length}건이 큐에 들어갑니다:`)
    for (const item of targets) console.log(item.number)
    return
  }

  // GitHub은 같은 사용자의 쓰기 요청을 직렬로 보내라고 안내합니다. 동시성 대신 재시도로 버팁니다.
  // 한 건이 실패해도 나머지를 계속 처리하고, 재실행하면 실패분만 남습니다.
  const failed: number[] = []
  let done = 0
  for (const item of targets) {
    try {
      await addLabels(item.number, [QUEUE_LABEL])
    } catch (error) {
      failed.push(item.number)
      console.error(`  #${item.number} 실패: ${(error as Error).message}`)
    }
    if (++done % 25 === 0) console.log(`  ${done}/${targets.length}`)
  }

  console.log(`성공 ${targets.length - failed.length}건 / 대상 ${targets.length}건`)
  if (failed.length > 0) {
    console.error(`실패 ${failed.length}건: ${failed.join(" ")}`)
    process.exit(1)
  }
}

async function cmdShow(issueArg: string, charsArg: string | undefined) {
  const issue = parseIssueNumber(issueArg)
  const chars = charsArg ? Number(charsArg) : 4000
  if (!Number.isFinite(chars) || chars <= 0) fail(`글자수가 올바르지 않습니다: ${charsArg}`)

  const { data } = await octokit.rest.issues.get({ owner, repo, issue_number: issue })
  const labels = data.labels
    .map((label) => (typeof label === "string" ? label : label.name))
    .filter(Boolean)
    .join(", ")

  // 코드 포인트 단위로 잘라 이모지나 한글이 중간에서 깨지지 않게 합니다.
  const body = [...(data.body ?? "")].slice(0, chars).join("")
  console.log(`#${data.number} ${data.title}\n라벨: ${labels}\n---\n${body}`)
}

async function cmdApply(issueArg: string, topics: string[]) {
  const issue = parseIssueNumber(issueArg)
  if (topics.length < 1) fail("주제 라벨을 최소 하나 지정하세요")
  if (topics.length > 3) fail(`주 라벨 1개에 보조 최대 2개까지입니다 (지정: ${topics.length}개)`)

  for (const topic of topics) {
    if (!isKnownTopic(topic)) {
      fail(`'${topic}' 는 정의된 주제가 아닙니다. 가능한 값: ${TOPIC_LABELS.join(" ")}`)
    }
  }

  await addLabels(issue, topics)
  await removeLabel(issue, QUEUE_LABEL)
  console.log(`#${issue} <- ${topics.join(" ")}`)
}

async function cmdSkip(issueArg: string) {
  const issue = parseIssueNumber(issueArg)
  await addLabels(issue, [SKIP_LABEL])
  await removeLabel(issue, QUEUE_LABEL)
  console.log(`#${issue} <- skipped`)
}

function parseIssueNumber(arg: string | undefined): number {
  const issue = Number(arg)
  if (!Number.isInteger(issue) || issue <= 0) fail(`이슈 번호가 올바르지 않습니다: ${arg}`)
  return issue
}

function usage() {
  console.log(`사용법: bun run queue.ts <명령>

  status               분류 대상(발행된 아이템)의 주제있음·큐·건너뜀 건수
  enqueue [--dry-run]  발행된 아이템 중 주제도 건너뜀도 없는 것을 큐에 넣기
  list                 큐에 있는 아이템의 번호와 제목
  show <번호> [글자수]  판정용 본문 (기본 4000자)
  apply <번호> <주제...> 주제 라벨 부착 + 큐에서 제거 (주 1개 + 보조 최대 2개)
  skip <번호>           판정 불가로 표시 + 큐에서 제거

대상 저장소는 .env 의 GITHUB_OWNER / GITHUB_REPO 를 따릅니다.`)
}

const [command, ...args] = process.argv.slice(2)

switch (command) {
  case "status":
    await cmdStatus()
    break
  case "list":
    await cmdList()
    break
  case "enqueue":
    await cmdEnqueue(args[0] === "--dry-run")
    break
  case "show":
    await cmdShow(args[0]!, args[1])
    break
  case "apply":
    await cmdApply(args[0]!, args.slice(1))
    break
  case "skip":
    await cmdSkip(args[0]!)
    break
  default:
    usage()
    process.exit(1)
}
