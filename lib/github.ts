import { Octokit } from "octokit"

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
      // TODO: config로 분리
      labels: "learn",
      page,
      per_page,
    })

    const issues = response.data.map((issue) => ({
      id: issue.node_id,
      number: issue.number,
      title: issue.title,
      createdAt: issue.created_at,
      labels: {
        nodes: issue.labels.map((label) => ({
          id: typeof label === "string" ? label : label.node_id,
          name: typeof label === "string" ? label : label.name,
          color: typeof label === "string" ? "" : label.color,
        })),
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

export async function getIssueByNo(issueNo: number) {
  try {
    const response = await octokit.rest.issues.get({
      owner,
      repo,
      issue_number: issueNo,
    })

    const issue = response.data

    return {
      id: issue.node_id,
      number: issue.number,
      title: issue.title,
      createdAt: issue.created_at,
      labels: {
        nodes: issue.labels.map((label) => ({
          id: typeof label === "string" ? label : label.node_id,
          name: typeof label === "string" ? label : label.name,
          color: typeof label === "string" ? "" : label.color,
        })),
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
  } catch (error) {
    console.error("failed to fetch(fetchIssue): ", error)
    throw error
  }
}

export function resolveAssetUrl(path: string) {
  return `/api/github-asset?url=${encodeURIComponent(path)}`
}

export const GITHUB_ASSET_URL_PREFIX = "https://github.com/user-attachments/assets"
