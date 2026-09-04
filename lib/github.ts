import { Octokit } from "octokit"

import { isTopicLabel, PUBLISH_GATE_LABEL } from "./labels"

if (!process.env.GITHUB_TOKEN) {
  throw new Error("env.GITHUB_TOKEN is not set.")
}

if (!process.env.GITHUB_OWNER) {
  throw new Error("env.GITHUB_OWNER is not set.")
}

if (!process.env.GITHUB_REPO) {
  throw new Error("env.GITHUB_REPO is not set.")
}

const auth = process.env.GITHUB_TOKEN
const owner = process.env.GITHUB_OWNER
const repo = process.env.GITHUB_REPO

export const config = {
  auth,
  owner,
  repo,
}

const octokit = new Octokit({
  auth,
})

type RestIssueLabels = Awaited<ReturnType<Octokit["rest"]["issues"]["get"]>>["data"]["labels"]

export interface LabelNode {
  id: string
  name: string
  color: string
}

/**
 * Normalizes an issue's labels into a shape the UI can render.
 * A label in GitHub's response may be a bare string or carry no name at all, and a nameless label
 * can neither be drawn nor classified, so it is filtered out here.
 */
function toLabelNodes(labels: RestIssueLabels): LabelNode[] {
  return labels.flatMap((label) => {
    if (typeof label === "string") {
      return [{ id: label, name: label, color: "" }]
    }
    if (!label.name) {
      return []
    }
    return [{ id: label.node_id ?? label.name, name: label.name, color: label.color ?? "" }]
  })
}

export interface Item {
  id: string
  number: number
  title: string
  createdAt: string
  body: string | null
  labels: {
    nodes: LabelNode[]
  }
  topics: string[]
}

let itemsPromise: Promise<Item[]> | undefined

/**
 * Every item the publish gate lets through, newest first.
 *
 * The promise is memoised for the life of the process because the root layout awaits this to hand
 * the search palette its titles, and a layout renders once per route: without the memo a build
 * would repeat the fetch for every one of the prerendered pages. Next builds across several
 * workers, so this makes it a handful of fetches rather than one, which is the point.
 */
export function getAllPublishedItems(): Promise<Item[]> {
  itemsPromise ??= fetchAllPublishedItems()
  return itemsPromise
}

async function fetchAllPublishedItems(): Promise<Item[]> {
  const issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
    owner,
    repo,
    state: "open",
    sort: "created",
    direction: "desc",
    labels: PUBLISH_GATE_LABEL,
    per_page: 100,
  })

  const items = issues
    // The issues endpoint returns pull requests too, and a pull request is not an item.
    .filter((issue) => !issue.pull_request)
    .map((issue) => {
      const nodes = toLabelNodes(issue.labels)

      return {
        id: issue.node_id,
        number: issue.number,
        title: issue.title,
        createdAt: issue.created_at,
        body: issue.body ?? null,
        labels: { nodes },
        topics: nodes.map((label) => label.name).filter(isTopicLabel),
      }
    })

  // An empty archive is always a misconfigured token or a renamed publish gate, never the truth.
  // Failing the build beats deploying a site that finds nothing.
  if (items.length === 0) {
    throw new Error("no published items: check GITHUB_TOKEN, GITHUB_REPO, and the publish gate")
  }

  return items
}

/**
 * The item behind a number, or `null` when there is none and when the publish gate does not let it
 * through.
 *
 * The gate is expressed here rather than at the page because nothing else fetches a single issue,
 * and a function handing back unpublished items would need the check restated at every call site
 * added later. See `docs/adr/0003-the-publish-gate-is-checked-when-an-item-renders.md`.
 */
export async function getIssueByNo(issueNo: number) {
  let issue: Awaited<ReturnType<Octokit["rest"]["issues"]["get"]>>["data"]

  try {
    const response = await octokit.rest.issues.get({
      owner,
      repo,
      issue_number: issueNo,
    })

    issue = response.data
  } catch (error) {
    if ((error as { status?: number }).status === 404) {
      return null
    }

    console.error("failed to fetch(getIssueByNo): ", error)
    throw error
  }

  const labels = toLabelNodes(issue.labels)

  if (issue.state !== "open" || !labels.some((label) => label.name === PUBLISH_GATE_LABEL)) {
    return null
  }

  return {
    id: issue.node_id,
    number: issue.number,
    title: issue.title,
    createdAt: issue.created_at,
    labels: {
      nodes: labels,
    },
    updatedAt: issue.updated_at,
    body: issue.body,
    author: {
      login: issue.user?.login,
      avatarUrl: issue.user?.avatar_url,
    },
    comments: {
      totalCount: issue.comments,
    },
    issueUrl: issue.html_url,
  }
}

export function resolveAssetUrl(path: string) {
  return `/api/github-asset?url=${encodeURIComponent(path)}`
}

export const GITHUB_ASSET_URL_PREFIX = "https://github.com/user-attachments/assets"
