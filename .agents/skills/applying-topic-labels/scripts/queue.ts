#!/usr/bin/env bun
/**
 * Work queue operations for secondthought.
 *
 * `docs/design/topic-taxonomy.md` is the single source of truth for how to decide a topic, and
 * `lib/labels.ts` is the single source of truth for which topics exist. Do not copy either here.
 *
 * Run from the repository root; bun reads `.env` automatically.
 */
import { readFile, writeFile } from "node:fs/promises"
import { Octokit } from "octokit"

import {
  isKnownTopic,
  isTopicLabel,
  PUBLISH_GATE_LABEL,
  QUEUE_LABEL,
  SKIP_LABEL,
  TOPIC_LABEL_PREFIX,
  TOPIC_LABELS,
} from "@/lib/labels"

function fail(message: string): never {
  console.error(`error: ${message}`)
  process.exit(1)
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    fail(`env.${name} is not set. Check that you are running from the repository root.`)
  }
  return value
}

const owner = requireEnv("GITHUB_OWNER")
const repo = requireEnv("GITHUB_REPO")

const octokit = new Octokit({
  auth: requireEnv("GITHUB_TOKEN"),
  // The octokit meta-package does not wire the throttling plugin's callback types into its options
  // type, so annotate the arguments here. Only what we actually use is typed.
  throttle: {
    onRateLimit: (retryAfter: number, _options: unknown, _octokit: unknown, retryCount: number) => {
      console.error(`  rate limited: retrying in ${retryAfter}s (attempt ${retryCount + 1})`)
      return retryCount < 3
    },
    onSecondaryRateLimit: (
      retryAfter: number,
      _options: unknown,
      _octokit: unknown,
      retryCount: number
    ) => {
      console.error(
        `  secondary rate limit: retrying in ${retryAfter}s (attempt ${retryCount + 1})`
      )
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
 * Fetches every issue and filters locally rather than using the label query parameter. A stale
 * label filter index has dropped an item silently before (ADR 0002, issue #109). At this size the
 * full fetch is four pages, so it costs almost nothing.
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
/** Only items past the publish gate are in scope; the rest never reach the site. */
const inScope = (item: Item) => has(item, PUBLISH_GATE_LABEL)

async function addLabels(issue: number, labels: string[]) {
  await octokit.rest.issues.addLabels({ owner, repo, issue_number: issue, labels })
}

/**
 * Removing a label an issue does not carry answers 404. That is the normal path for an item which
 * was never queued, so swallow it and let anything else through.
 */
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
    ["total", all.length],
    ["in scope", target.length],
    ["  labeled", target.filter(hasTopic).length],
    ["  queued", target.filter((i) => has(i, QUEUE_LABEL)).length],
    ["  skipped", target.filter((i) => has(i, SKIP_LABEL)).length],
    [
      "  not queued yet",
      target.filter((i) => !hasTopic(i) && !has(i, SKIP_LABEL) && !has(i, QUEUE_LABEL)).length,
    ],
    ["out of scope (no gate label)", all.length - target.length],
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
    console.log("Nothing to queue.")
    return
  }
  if (dryRun) {
    console.log(`${targets.length} item(s) would be queued:`)
    for (const item of targets) console.log(item.number)
    return
  }

  // GitHub asks that writes for one user go out serially, so retry rather than run concurrently.
  // One failure does not stop the rest; re-running leaves only whatever failed.
  const failed: number[] = []
  let done = 0
  for (const item of targets) {
    try {
      await addLabels(item.number, [QUEUE_LABEL])
    } catch (error) {
      failed.push(item.number)
      console.error(`  #${item.number} failed: ${(error as Error).message}`)
    }
    if (++done % 25 === 0) console.log(`  ${done}/${targets.length}`)
  }

  console.log(`${targets.length - failed.length} succeeded of ${targets.length}`)
  if (failed.length > 0) {
    console.error(`${failed.length} failed: ${failed.join(" ")}`)
    process.exit(1)
  }
}

async function cmdShow(issueArg: string | undefined, charsArg: string | undefined) {
  const issue = parseIssueNumber(issueArg)
  const chars = charsArg ? Number(charsArg) : 4000
  if (!Number.isFinite(chars) || chars <= 0) fail(`character count is not valid: ${charsArg}`)

  const { data } = await octokit.rest.issues.get({ owner, repo, issue_number: issue })
  const labels = data.labels
    .map((label) => (typeof label === "string" ? label : label.name))
    .filter(Boolean)
    .join(", ")

  // Slice by code point so multi-byte characters and emoji never split mid-character.
  const body = [...(data.body ?? "")].slice(0, chars).join("")
  console.log(`#${data.number} ${data.title}\nlabels: ${labels}\n---\n${body}`)
}

async function cmdApply(issueArg: string | undefined, topics: string[]) {
  const issue = parseIssueNumber(issueArg)
  if (topics.length < 1) fail("name at least one topic label")
  if (topics.length > 3) {
    fail(`one primary label plus at most two secondary ones (got ${topics.length})`)
  }

  for (const topic of topics) {
    if (!isKnownTopic(topic)) {
      fail(`'${topic}' is not a defined topic. Available: ${TOPIC_LABELS.join(" ")}`)
    }
  }

  await addLabels(issue, topics)
  await removeLabel(issue, QUEUE_LABEL)
  // An item cannot be both classified and skipped, so applying a topic clears the skip.
  await removeLabel(issue, SKIP_LABEL)
  console.log(`#${issue} <- ${topics.join(" ")}`)
}

/**
 * Replaces an item's topic labels with the given set. Use this to correct a decision: `apply` only
 * adds, so a label applied by mistake would otherwise stay on the item forever.
 */
async function cmdRetag(issueArg: string | undefined, topics: string[]) {
  const issue = parseIssueNumber(issueArg)
  if (topics.length < 1) fail("name at least one topic label")
  if (topics.length > 3) fail(`at most three labels (got ${topics.length})`)
  for (const topic of topics) {
    if (!isKnownTopic(topic)) {
      fail(`'${topic}' is not a defined topic. Available: ${TOPIC_LABELS.join(" ")}`)
    }
  }

  const { data } = await octokit.rest.issues.get({ owner, repo, issue_number: issue })
  const current = data.labels
    .map((label) => (typeof label === "string" ? label : label.name))
    .filter((name): name is string => isTopicLabel(name))

  const removed = current.filter((name) => !topics.includes(name))
  const added = topics.filter((name) => !current.includes(name))

  if (added.length > 0) await addLabels(issue, added)
  for (const name of removed) await removeLabel(issue, name)
  await removeLabel(issue, QUEUE_LABEL)
  await removeLabel(issue, SKIP_LABEL)

  const summary = [
    added.length > 0 ? `+${added.join(" +")}` : null,
    removed.length > 0 ? `-${removed.join(" -")}` : null,
  ].filter(Boolean)
  console.log(`#${issue} ${summary.length > 0 ? summary.join(" ") : "(no change)"}`)
}

/**
 * Defines a new topic: writes it into `lib/labels.ts`, which is the single source of truth for the
 * topic set, and creates the label on GitHub. Recording it in the taxonomy document is still a
 * judgment call and stays manual.
 */
async function cmdAddTopic(
  slugArg: string | undefined,
  display: string | undefined,
  color: string | undefined,
  description: string | undefined
) {
  if (!slugArg || !display || !color || !description) {
    fail("usage: add-topic <slug> <display> <color> <description>")
  }
  const label = slugArg.startsWith(TOPIC_LABEL_PREFIX) ? slugArg : TOPIC_LABEL_PREFIX + slugArg
  if (!/^topic\/[a-z0-9-]+$/.test(label)) fail(`'${label}' is not a valid topic label name`)
  if (!/^[0-9A-Fa-f]{6}$/.test(color)) fail(`'${color}' is not a six-digit hex color`)
  if (isKnownTopic(label)) fail(`'${label}' is already defined`)

  const path = "lib/labels.ts"
  const source = await readFile(path, "utf8")
  const anchor = "\n} as const"
  const at = source.indexOf(anchor)
  if (at < 0) fail(`could not find the topic map in ${path}; add the entry by hand`)
  const entry = `\n  "${label}": "${display}",`
  await writeFile(path, source.slice(0, at) + entry + source.slice(at))
  console.log(`${path} <- "${label}": "${display}"`)

  await octokit.rest.issues.createLabel({ owner, repo, name: label, color, description })
  console.log(`${owner}/${repo} <- label ${label} (#${color})`)
  console.log("Remember to record the new topic in docs/design/topic-taxonomy.md.")
}

async function cmdSkip(issueArg: string | undefined) {
  const issue = parseIssueNumber(issueArg)
  await addLabels(issue, [SKIP_LABEL])
  await removeLabel(issue, QUEUE_LABEL)
  console.log(`#${issue} <- skipped`)
}

function parseIssueNumber(arg: string | undefined): number {
  const issue = Number(arg)
  if (!Number.isInteger(issue) || issue <= 0) fail(`issue number is not valid: ${arg}`)
  return issue
}

function usage() {
  console.log(`Usage: bun run queue.ts <command>

  status                     Counts across in-scope items: labeled, queued, skipped
  enqueue [--dry-run]        Queue published items with neither a topic nor a skip
  list                       Number and title of every queued item
  show <number> [chars]      Body text for deciding (4000 characters by default)
  apply <number> <topic...>  Add topic labels, then drop from the queue
  retag <number> <topic...>  Replace an item's topic labels (use to correct a decision)
  skip <number>              Mark as undecidable, then drop from the queue
  add-topic <slug> <display> <color> <description>
                             Define a new topic in lib/labels.ts and on GitHub

The target repository comes from GITHUB_OWNER and GITHUB_REPO in .env.`)
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
    await cmdShow(args[0], args[1])
    break
  case "apply":
    await cmdApply(args[0], args.slice(1))
    break
  case "retag":
    await cmdRetag(args[0], args.slice(1))
    break
  case "add-topic":
    await cmdAddTopic(args[0], args[1], args[2], args.slice(3).join(" "))
    break
  case "skip":
    await cmdSkip(args[0])
    break
  default:
    usage()
    process.exit(1)
}
