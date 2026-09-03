---
name: applying-topic-labels
description: "Use when items in the TMT archive need topic labels — draining the secondthought/needs-topic queue, deciding a single issue's subject, or backfilling topic labels across TMT-items."
---

# Applying Topic Labels

Reads items in `JHSeo-git/TMT-items`, decides what each one is about, and applies a `topic/` label.
A `secondthought` agent will eventually do this from a GitHub Action; for now the same work runs
locally by hand. That is why the agent's name appears in the label namespace but not in the skill
name — the skill is the work, `secondthought` is what will do the work automatically.

**`docs/design/topic-taxonomy.md` is the single source of truth for how to decide. Read it before
applying a single label.** It holds the eight category definitions, the priority order for
conflicts, and boundary cases pinned to real issue numbers. That document is written in Korean.
Do not copy any of it into this file — two copies always drift.

## Label boundaries

Only touch labels whose name contains a `/`. Unprefixed labels (`published`, `draft`, `secret`)
belong to a human, and deciding whether something gets published is not this skill's job.

Only items carrying `published` are in scope. An item that has not passed the gate never reaches
the site, so it needs no topic — and most of those (a résumé, a travel note) fall outside the topic
axis entirely.

## Commands

Run from the repository root. Bun picks up `GITHUB_TOKEN`, `GITHUB_OWNER`, and `GITHUB_REPO` from
`.env` automatically.

```
bun run .agents/skills/applying-topic-labels/scripts/queue.ts <command>
```

| Command | What it does |
| --- | --- |
| `status` | Counts across in-scope items: labeled, queued, skipped |
| `enqueue [--dry-run]` | Queue published items that have neither a topic nor a skip |
| `list` | Number and title of every queued item |
| `show <number> [chars]` | Body text for deciding (4000 characters by default) |
| `apply <number> <topic...>` | Add topic labels, then drop the item from the queue |
| `skip <number>` | Mark as undecidable, then drop the item from the queue |

The script rejects unknown topic names and more than three labels. Both are mechanical constraints
rather than judgment calls, so there is nothing to memorize.

The topic list itself lives in `lib/labels.ts` as its single source of truth. Adding or renaming a
topic there carries the site's display names and this script's validation along with it.

## Deciding

Give each item exactly one **primary label**, plus up to two secondary labels when they are
certain. Pick the primary by asking what the piece is ultimately about. The first argument is the
primary label.

Never decide from the title alone. Most items here are translations or summaries of outside
writing, and the words in a title often pull away from the actual argument. #320
"2026년의 AI 에이전트 샌드박싱" (AI agent sandboxing in 2026) carries "agent" in its title but is a
runtime comparison. Use `show` to read the opening and the source URL before deciding.

When an item is a personal record outside the topic axis, or its body is empty, `skip` it rather
than forcing a label onto it. Left in the queue, it keeps the queue from ever emptying.

## Working through the queue

Handle one item at a time: `show`, then `apply`. Scanning many at once and applying labels in a
batch drifts toward deciding from titles without reading the bodies. The queue can be stopped and
picked back up at any point, so there is no reason to hurry.

## Common mistakes

| Mistake | Why it hurts |
| --- | --- |
| Re-applying a topic label that is already there | Re-applying a label has thrown GitHub's label filter index out of sync before (ADR 0002, issue #109). Change only what needs changing. |
| Counting the queue with `gh issue list --label` | When that index is stale, items go missing silently. `queue.ts` fetches every issue and filters locally. |
| Calling a topic a "category" | `CONTEXT.md` fixes the term for this axis as *topic* and puts *category* under `_Avoid_`. |
| Filling all three labels because the call is unclear | Secondary labels are for certainty. When it is unclear, leave the primary label on its own. |
