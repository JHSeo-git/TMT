import { Octokit } from "octokit"

import { PUBLISH_GATE_LABEL } from "./labels"

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

interface LabelNode {
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

interface GetIssuesParams {
  page?: number
  per_page?: number
}

export async function getIssues({ page = 1, per_page = 100 }: GetIssuesParams = {}) {
  try {
    const response = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: "open",
      sort: "created",
      direction: "desc",
      labels: PUBLISH_GATE_LABEL,
      page,
      per_page,
    })

    const issues = response.data.map((issue) => ({
      id: issue.node_id,
      number: issue.number,
      title: issue.title,
      createdAt: issue.created_at,
      labels: {
        nodes: toLabelNodes(issue.labels),
      },
    }))

    const linkHeader = response.headers.link
    let lastPage = 0

    if (linkHeader) {
      const links = linkHeader.split(", ")
      links.forEach((link) => {
        const [url, rel] = link.split("; ")
        const pageMatch = url.match(/&page=(\d+)/)
        if (pageMatch) {
          const page = parseInt(pageMatch[1], 10)
          if (rel === 'rel="last"') {
            lastPage = page
          }
        }
      })
    }

    lastPage = lastPage === 0 ? page : lastPage

    const hasNextPage = page < lastPage

    return {
      issues: issues.map((issue, index) => ({
        ...issue,
        nextIssueNo: issues[index - 1]?.number,
        prevIssueNo: issues[index + 1]?.number,
      })),
      pageInfo: {
        currentPage: page,
        hasNextPage,
        lastPage,
      },
    }
  } catch (error) {
    console.error("failed to fetch(getAllIssueId): ", error)
    throw error
  }
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
