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
applying a single label.** It holds the nine category definitions, the priority order for
conflicts, and boundary cases pinned to real issue numbers. Do not copy any of it into this file —
two copies always drift.

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
| `retag <number> <topic...>` | Replace an item's topic labels, to correct an earlier decision |
| `skip <number>` | Mark as undecidable, then drop the item from the queue |
| `add-topic <slug> <display> <color> <description>` | Define a new topic in `lib/labels.ts` and on GitHub |

The script rejects unknown topic names and more than three labels. Both are mechanical constraints
rather than judgment calls, so there is nothing to memorize.

The topic list itself lives in `lib/labels.ts` as its single source of truth. Adding or renaming a
topic there carries the site's display names and this script's validation along with it.

## Deciding

Start by asking what the piece is ultimately about, and give it that label. Add up to two more when
they are equally true of the piece. **The labels carry equal weight** — GitHub stores them as an
unordered set, so nothing distinguishes the one you picked first. Asking "what is this mainly
about" is a way to think, not a slot to fill: it keeps you from labeling by loose association.

Never decide from the title alone. Most items here are translations or summaries of outside
writing, and the words in a title often pull away from the actual argument. #320
"2026년의 AI 에이전트 샌드박싱" (AI agent sandboxing in 2026) carries "agent" in its title but is a
runtime comparison. Use `show` to read the opening and the source URL before deciding.

**If the opening does not settle it, read further.** `show` takes a character count — go to 1500 or
3000 and read the part where the piece states its actual argument. An item labeled from a guess
costs more than the minute it takes to read on. Two examples from the first full pass: #14
looked like a Java language explainer until the middle turned out to be about when to choose each
kind of exception, and #188 looked like a note-taking essay until the body turned out to be a tool
setup. Both moved once they were read properly.

**If nothing in the topic list fits, add a topic** with `add-topic` rather than forcing the nearest
label. That is a real action available here, not a request to file. A topic is worth adding when
several items would carry it and none of the existing ones describes them — `topic/devex` came
out of exactly that, from four items about local machine setup and small utilities that had been
skipped for want of a home. After adding one, record it in `docs/design/topic-taxonomy.md`; the
script only handles the mechanical half.

`skip` is for an item with no body to read at all. Anything with content gets a label, whether an
existing one or a new one.

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
| Filling all three labels because the call is unclear | Extra labels are for what is equally true of the piece. When the call is unclear, read further instead of padding. |
| Forcing the nearest label when none fits | `add-topic` exists. A forced label is worse than a new topic, because it makes the label mean less for every item already carrying it. |
