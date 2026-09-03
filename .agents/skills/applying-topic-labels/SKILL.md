---
name: applying-topic-labels
description: "Use when items in the TMT archive need topic labels — draining the secondthought/needs-topic queue, deciding a single issue's subject, or backfilling topic labels across TMT-items."
---

# Applying Topic Labels

Reads items in `JHSeo-git/TMT-items`, decides what each one is about, and applies a `topic/` label.
A `secondthought` agent will eventually do this from a GitHub Action; for now the same work runs
locally by hand.

**Read `docs/design/topic-taxonomy.md` before applying a single label.** It owns the nine topic
definitions, the priority order when they conflict, how many labels an item gets, when to add a new
topic instead of forcing one, and boundary cases pinned to real issue numbers. None of that is
restated here — two copies drift, and this file has drifted once already.

Only items carrying `published` are in scope; the rest never reach the site.

## Running

From the repository root, where bun reads `.env`:

```
bun run .agents/skills/applying-topic-labels/scripts/queue.ts <command>
```

`show <number> [chars]` and `apply <number> <topic...>` are the loop. Run the script with no
arguments for the rest, including `retag` to correct an earlier decision and `add-topic` to define
a new one. It rejects unknown topic names and more than three labels, so neither is yours to
remember.

## Deciding

**Never decide from the title.** Most items are translations of outside writing, and a title's
words often pull away from the argument: #320 "2026년의 AI 에이전트 샌드박싱" carries "agent" in its
title and is a runtime comparison. Read the source URL and the opening first.

**If the opening does not settle it, read on.** `show` takes a character count, and 1500 or 3000
reaches the part where a piece states its actual argument. Two items moved this way on the first
pass: #14 read like a Java language explainer until its middle turned out to be about choosing
between kinds of exception, and #188 read like a note-taking essay until its body turned out to be
a tool setup.

**Handle one item at a time**, `show` then `apply`. Scanning several and labeling in a batch drifts
back toward deciding from titles. The queue stops and resumes anywhere, so there is no reason to
hurry.

## Common mistakes

| Mistake | Why it hurts |
| --- | --- |
| Re-applying a label the item already has | Re-applying has thrown GitHub's label filter index out of sync before (ADR 0002, #109). Change only what needs changing. |
| Counting the queue with `gh issue list --label` | A stale index drops items silently. `queue.ts` fetches every issue and filters locally. |
| Calling a topic a "category" | `CONTEXT.md` fixes the term as *topic* and puts *category* under `_Avoid_`. |
| Padding to three labels when the call is unclear | Read further instead. |
